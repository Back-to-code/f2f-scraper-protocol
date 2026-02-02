import {
	CustomHandler,
	CustomHandlerCallback,
	Handlers,
	PotentialPromise,
	resolveApiHandler,
	resolveExternalHandler,
} from "./handlers.ts"
import { type Cv } from "./cv.ts"
import { Stats } from "./stats.ts"
import { formatCvFilename } from "./cv_document.ts"
import { Slack } from "./slack.ts"
import { Registry } from "prom-client"
import { sleep } from "bun"

export interface ServerOptions {
	// Required (If not set by env variables):
	apiServer?: string // If not set will try to use RTCV_SERVER env variable

	// Optional:
	alternativeServer?: string | false // If not set will try to use RTCV_ALTERNATIVE_SERVER env variable, if set to false will disable alternative server
	port?: number // If not set will try to use SERVER_PORT or default to: 3000
	noHealthChecks?: boolean // If set to true will disable health checks on the RT-CV server
	skipSlugCheck?: boolean // If set to true will not check and update the slug on the RT-CV server
	skipAliveCheck?: boolean // If set to true will skip the check if the scraper is allowed to scrape

	customHandlers?: CustomHandler[] // If set will add external handlers to the server
}

export interface FetchOptions {
	method?: RequestInit["method"] // default is: "GET"
	body?: unknown
	headers?: Record<string, string>
}

export interface LoginUser {
	username: string
	password: string
	invalid: boolean
}

export interface SiteStorageCredentialsValue {
	cookies: Record<string, Array<string>> | null
}

export interface SiteStorageCredentials extends SiteStorageCredentialsValue {
	id: string
	scraperId: string

	invalid: boolean
	hiddenCredentials: boolean
}

export interface Candidate {
	id: string
	createdAt: string
	updatedAt: string
	invite?: string
	cv?: Cv
	referenceNr: string
}

interface ServerAuth {
	username: string
	password: string
}

export interface VisitedCv {
	id: string
	referenceNr: string
	contentHash?: VisitedCvContentHash // Deprecated use contentHashes instaid
	contentHashes?: Array<VisitedCvContentHash>
	updatedAt: string // rfc3339
	matchedDate?: string // rfc3339
}

export interface VisitedCvContentHash {
	version: string
	hash: string
}

export class FetchError {
	public path: string
	public status: number
	public response: string
	// deno-lint-ignore no-explicit-any
	public parsedResponse: any | null = null

	constructor(response: string, path: string, status: number) {
		this.path = path
		this.status = status
		this.response = response
		try {
			this.parsedResponse = JSON.parse(this.response)
		} catch (_e) {
			// Ignore
		}
	}
}

const DURATION_BETWEEN_CVS_SENT = 4000

export class Server {
	private port: number
	private apiServer: string
	private apiKeyId: string
	private primaryServerAuth: ServerAuth
	private alternativeServerAuth?: ServerAuth
	private alternativeServer?: Server
	private externalHandlers: Map<string, CustomHandlerCallback> = new Map()
	private internalSlackCache?: Slack
	private externalSlackCache?: Slack
	private skipAliveCheck: boolean
	private lastAliveCheck: number | null = null
	public lastSentCv: Date | null = null

	constructor(
		public readonly slug: string,
		private handlers: Handlers,
		options: ServerOptions,
		public readonly isAlternativeServer: boolean = false,
	) {
		const potentialsServerPort = this.mightGetEnv("SERVER_PORT")
		if (potentialsServerPort) {
			this.port = Number(potentialsServerPort)
			if (Number.isNaN(this.port)) {
				console.log("the $SERVER_PORT shell variable is not a number")
			}
		} else {
			this.port = options.port ?? 3000
		}

		this.skipAliveCheck =
			options.skipAliveCheck ??
			this.mightGetEnv("SKIP_ALIVE_CHECK").toLowerCase() === "true"

		const apiServer = new URL(
			options.apiServer || this.mustGetEnv("RTCV_SERVER"),
		)
		if (!apiServer.username || !apiServer.password) {
			console.log(
				"RTCV_SERVER url must contain api credentials like: https://key_id:key@example.com",
			)
			process.exit(1)
		}

		if (slug === "" && !options.skipSlugCheck) {
			console.log(
				"Error: slug is required for the scraper to be identifiable! If you are sure that you want to run the scraper without a slug, use the skipSlugCheck option in options.",
			)
			process.exit(1)
		}

		this.apiKeyId = apiServer.username
		this.apiServer = apiServer.origin
		this.primaryServerAuth = {
			username: apiServer.username,
			password: apiServer.password,
		}

		// Health check the RT-CV server
		if (!options.noHealthChecks) {
			this.health().catch((e) => {
				console.log(`Failed to ping RT-CV (${apiServer}), error:`, e)
				process.exit(1)
			})
		}

		if (!options.skipSlugCheck) this.setSlug()

		if (options.customHandlers) {
			try {
				this.addCustomHandler(options.customHandlers)
			} catch (e) {
				console.log("Failed to add external handlers, error:", e)
				process.exit(1)
			}
		}

		if (options.alternativeServer !== false) {
			const alternativeServer =
				options.alternativeServer || this.mightGetEnv("RTCV_ALTERNATIVE_SERVER")

			if (alternativeServer) {
				const alternativeServerUrl = new URL(alternativeServer)
				if (alternativeServerUrl.username && alternativeServerUrl.password) {
					this.alternativeServerAuth = {
						username: alternativeServerUrl.username,
						password: alternativeServerUrl.password,
					}
				}

				this.alternativeServer = new Server(
					slug,
					{},
					{
						apiServer: alternativeServer,
						alternativeServer: false,
						port: this.port,
					},
					true,
				)
			}
		}
	}

	// ---
	// Public methods
	// ---

	public startStatsServer(port = 9091): Stats {
		const prefix = this.slug.replace("-", "_") + "_"

		const register = new Registry()
		const stats = new Stats(prefix, register)

		Bun.serve({
			port,
			async fetch(request) {
				const parsedUrl = new URL(request.url)

				if (parsedUrl.pathname !== "/metrics") {
					return new Response("Not found", { status: 404 })
				}

				const metrics = await register.metrics()
				return new Response(metrics)
			},
		})

		console.log(`Serving stats on localhost:${port}/metrics`)

		return stats
	}

	public async alive(): Promise<void> {
		if (this.skipAliveCheck) {
			return
		}

		if (
			typeof this.lastAliveCheck === "number" &&
			Date.now() - this.lastAliveCheck < 60 * 1000
		) {
			return
		}

		while (true) {
			try {
				const response = await this.fetch<{ active: boolean }>(
					"/api/v1/scraper/status",
				)
				if (response.active) {
					this.lastAliveCheck = Date.now()
					return
				}
				console.log("Scraper is not active, waiting 5 minutes...")
			} catch (e) {
				console.warn("Failed to check scraper status, waiting 5 minutes...", e)
			}
			await sleep(5 * 60 * 1000)
		}
	}

	public async fetchWithRetry<T = unknown>(
		path: string,
		options: FetchOptions = {},
	): Promise<T> {
		let retries = 0
		while (true) {
			try {
				return await this.fetch(path, options)
			} catch (e) {
				if (
					e instanceof FetchError &&
					e.status >= 400 &&
					e.parsedResponse &&
					e.parsedResponse?.kind
				) {
					const kind = e.parsedResponse.kind as string

					if (
						kind.startsWith("AUTH_") ||
						kind === "INPUT_VALIDATION" ||
						kind === "BOGUS_FORM_DATA" ||
						kind === "APP_INTERNAL_CONFIG"
					) {
						// This request will keep failing as there is an error on our end, so we should not retry
						throw e
					}
				}

				if (retries < 3) {
					retries++
					const waitSeconds = retries * 3
					console.log(
						`failed to fetch ${path}, retrying in ${waitSeconds} second`,
					)
					await new Promise((resolve) =>
						setTimeout(resolve, waitSeconds * 1000),
					)
				} else {
					throw e
				}
			}
		}
	}

	// Make a request to RT-CV
	// Returns the response decoded as JSOn
	public async fetch<T = unknown>(
		path: string,
		options: FetchOptions = {},
	): Promise<T> {
		const controller = new AbortController()
		const id = setTimeout(() => controller.abort(), 60_000)

		const fetchOptions: Parameters<typeof fetch>[1] = {
			method: options.method,
			headers: {
				...options.headers,
				Accept: "application/json",
				Authorization: this.authorizationHeader,
			},
			signal: controller.signal,
		}

		if (options.body) {
			if (options.body instanceof FormData) {
				fetchOptions.body = options.body
				// Content-Type will be set automatically by the fetch method
			} else {
				fetchOptions.body = JSON.stringify(options.body)
				fetchOptions.headers = {
					...fetchOptions.headers,
					"Content-Type": "application/json",
				}
			}
		}

		const r = await fetch(this.apiServer + path, fetchOptions)
		clearTimeout(id)
		if (r.status >= 400) {
			throw new FetchError(await r.text(), path, r.status)
		}

		return r.json() as Promise<T>
	}

	// health checks if the api server is up and running and if not throws an error
	public async health() {
		await this.fetchWithRetry("/api/v1/health")
	}

	// get all login users for the api key
	public async getUsers(
		mustBeAtLeastOneUser: boolean,
	): Promise<Array<LoginUser>> {
		const response = await this.fetchWithRetry("/api/v1/scraperUsers")
		const { users } = response as any

		if (users.length == 0 && mustBeAtLeastOneUser) {
			throw "No login users found"
		}

		const usersWithoutPasswords = users.filter(
			(user: LoginUser) => !user.password,
		).length
		if (users.length > 0 && usersWithoutPasswords === users.length) {
			throw "This key uses a unsupported and deprecated scraper user encryption method, please convert your users to the new encryption method via the RT-CV dashboard"
		}

		return shuffle(users)
	}

	public async reportLoginSuccess(usernameOrUser: string | LoginUser) {
		return await this.reportLoginAttempt(usernameOrUser, true)
	}

	public async reportLoginFailure(usernameOrUser: string | LoginUser) {
		return await this.reportLoginAttempt(usernameOrUser, false)
	}

	public async reportLoginAttempt(
		usernameOrUser: string | LoginUser,
		success: boolean,
	) {
		const username =
			typeof usernameOrUser === "string"
				? usernameOrUser
				: usernameOrUser.username

		try {
			await this.fetchWithRetry("/api/v1/scraperUsers/reportLoginAttempt", {
				method: "POST",
				body: {
					username,
					success,
				},
			})
		} catch (e) {
			console.warn(
				`failed to report login ${
					success ? "success" : "failure"
				} for user "${username}", error:`,
				e,
			)
		}
		await this.alternativeServer?.reportLoginAttempt(usernameOrUser, success)
	}

	// Gets all the site credentials for the api key
	//
	public async getSiteStorageCredentials(): Promise<{
		all: Array<SiteStorageCredentials>
		valid: Array<SiteStorageCredentials>
		invalid: Array<SiteStorageCredentials>
		atLeastOneValidCredential: boolean
	}> {
		const credentials: Array<SiteStorageCredentials> =
			await this.fetchWithRetry(
				"/api/v1/siteStorageCredentials/scraper/" + this.apiKeyId,
			)

		if (!Array.isArray(credentials)) {
			throw `Unexpected RT-CV response for site credentials, expected array but got ${JSON.stringify(
				credentials,
			)}`
		}

		const valid: Array<SiteStorageCredentials> = []
		const invalid: Array<SiteStorageCredentials> = []
		for (const credential of credentials) {
			if (credential.hiddenCredentials) {
				throw "This api is not allowed to see the contents of site storage credentials"
			}
			if (credential.invalid) {
				invalid.push(credential)
			} else {
				valid.push(credential)
			}
		}

		return {
			all: credentials,
			valid,
			invalid,
			atLeastOneValidCredential: valid.length > 0,
		}
	}

	// sets the invalid flag of a site storage credential to **true**
	public invalidateSiteStorageCredential(
		credential: SiteStorageCredentials,
	): Promise<SiteStorageCredentials> {
		return this.fetchWithRetry(
			"/api/v1/siteStorageCredentials/" + credential.id + "/invalidate",
			{ method: "PATCH" },
		)
	}

	// sets the invalid flag of a site storage credential to **false**
	public validateSiteStorageCredential(
		credential: SiteStorageCredentials,
	): Promise<SiteStorageCredentials> {
		return this.fetchWithRetry(
			"/api/v1/siteStorageCredentials/" + credential.id + "/validate",
			{ method: "PATCH" },
		)
	}

	protected validateCv(cv: Cv) {
		if (!cv.referenceNumber) throw "referenceNumber is required"

		const dob = cv?.personalDetails?.dob
		if (dob) {
			const parsedDob = new Date(dob)
			const now = new Date()
			if (now.getFullYear() - parsedDob.getFullYear() < 13) {
				throw "you must be at least 13 years old to work"
			}
		}
	}

	// Check if a CV has matches on RT-CV
	// This can be used for example if scraping a partial cv is easy but a full cv is complicated
	// In those cases you can first check if the cv has matches with partial data and if it does you scrape the full cv
	//
	// Currently this is used by the linkedin scraper to firstly check if the directly visible profile matches something.
	// If so we also scrape all the information hidden behind models
	async cvHasMatches(cv: Cv): Promise<boolean> {
		this.validateCv(cv)

		const response = await this.fetchWithRetry("/api/v1/scraper/dryScanCV", {
			body: { cv },
			method: "POST",
		})

		return (response as any).hasMatches
	}

	// Send a scraped CV to RT-CV
	public async sendCv(cv: Cv, checks = true): Promise<void> {
		if (checks && !this.isAlternativeServer) {
			await this.alive()
			await this.throttleCvSend()
			this.validateCv(cv)
		}

		this.alternativeServer?.sendCv(cv, false).catch((e) => {
			console.log("failed to send cv to alternative server,", e)
		})

		try {
			await this.fetchWithRetry("/api/v1/scraper/scanCV", {
				body: { cv },
				method: "POST",
			})

			this.lastSentCv = new Date()
		} catch (e) {
			if (cv.personalDetails && e instanceof FetchError) {
				let alteredCv = false

				// Lets check if we can remove the fields that gave an error and try it again
				if (
					(e.response.includes("phone number") ||
						e.response.includes("phonenumber")) &&
					cv.personalDetails
				) {
					alteredCv = true
					cv.personalDetails.phoneNumber = undefined
				}
				if (e.response.includes("email") && cv.personalDetails) {
					alteredCv = true
					cv.personalDetails.email = undefined
				}

				if (alteredCv) {
					return await this.sendCv(cv, false)
				}
			}

			throw e
		}
	}

	public async sendCvsList(cvs: Array<Cv>, preValidation = true) {
		if (preValidation) for (const cv of cvs) this.validateCv(cv)

		// Stip information from CVs that is not needed for list CVs
		for (let idx = 0; idx < cvs.length; idx++) {
			const cv = cvs[idx]
			cvs[idx] = {
				referenceNumber: cv.referenceNumber,
				link: cv.link,
				createdAt: cv.createdAt,
				lastChanged: cv.lastChanged,
				personalDetails: cv.personalDetails,
			}
		}

		this.alternativeServer?.sendCvsList(cvs, false).catch((e) => {
			console.log("failed to send cvs list to alternative server,", e)
		})
		const body = { cvs }
		await this.fetchWithRetry("/api/v1/scraper/allCVs", {
			body,
			method: "POST",
		})
	}

	// sendCvDocument sends a CV document to RT-CV
	public async sendCvDocument(metadata: Cv, cvFile: Blob, filename?: string) {
		if (!this.isAlternativeServer) {
			await this.alive()
			await this.throttleCvSend()
		}

		const body = new FormData()

		body.set("metadata", JSON.stringify(metadata))
		body.set("cv", cvFile, formatCvFilename(filename, cvFile.type))

		await this.fetchWithRetry("/api/v1/scraper/scanCVDocument", {
			body,
			method: "POST",
		})

		this.lastSentCv = new Date()

		// Only send the cv document to the alternative server once the primary server has successfully received it
		// We do this for 2 reasons:
		//   1. Scanning the CV Documents takes up quite a bit of api credits from google cloud ocr and from together.ai,
		//      doing tese calls after each other makes it so the cv document is cached
		//   2. If the primary server fails to scan the cv document the alternative server will also very likely fail.
		if (this.alternativeServer) {
			await this.alternativeServer
				.fetch("/api/v1/scraper/scanCVDocument", {
					body,
					method: "POST",
				})
				.catch((e) => {
					console.log("failed to send cv document to alternative server,", e)
				})
		}
	}

	// ThrottleCvSend throttles the sending of cv documents
	// We do this as when a scraper behaves incorrectly we can still interrupt the sending of CVs
	private async throttleCvSend() {
		if (
			this.lastSentCv &&
			Date.now() - this.lastSentCv.getTime() < DURATION_BETWEEN_CVS_SENT
		) {
			// There needs to be last least 4 seconds between each cv that is sent
			await sleep(DURATION_BETWEEN_CVS_SENT)
		}
	}

	// startServer starts the server and listens for incoming connections
	public startServer() {
		console.log(`Listening on http://localhost:${this.port}/`)
		Bun.serve({
			port: this.port,
			fetch: (request: Request) => this.outerHandleRequest(request),
		})
	}

	/**
	addHandler adds a handler to the server

	Paramaters:
	- externalHandlers: an array of ExternalHandler objects

	Throws:
	- Error: if the handler is already registered
	*/
	public addCustomHandler(externalHandlers: CustomHandler[]) {
		for (const handler of externalHandlers) {
			const { path, method, handler: handlerFunc } = handler
			const methodPathString = `${method} ${path}`

			if (this.externalHandlers.has(methodPathString)) {
				throw new Error(`Handler already exists for ${methodPathString}`)
			}

			this.externalHandlers.set(methodPathString, handlerFunc)
		}
	}

	public candidateRequestPersonalDetials(
		referenceNr: string,
	): Promise<{ candidate: Candidate; created: boolean }> {
		return this.fetch("/api/v1/candidates", {
			method: "POST",
			body: { referenceNr },
		})
	}

	public async cvVisit(referenceNr: string): Promise<VisitedCv | undefined> {
		try {
			return await this.fetch("/api/v1/visitedCvs/byReference/" + referenceNr)
		} catch (e) {
			if (
				e instanceof FetchError &&
				e.response.toLowerCase().includes("no documents in result")
			) {
				return undefined
			}

			throw e
		}
	}

	// Send a message to the error channel within the Script / Backtocode slack.
	// Only visible for us developers.. hence internal.
	public get internalSlack(): Slack {
		if (!this.internalSlackCache)
			this.internalSlackCache = new Slack(true, this)
		return this.internalSlackCache
	}

	// Send a message to the error channel within the First2find slack.
	// Mainly viewed by Sander.. hence external.
	public get externalSlack(): Slack {
		if (!this.externalSlackCache)
			this.externalSlackCache = new Slack(false, this)
		return this.externalSlackCache
	}

	// ---
	// Private methods
	// ---

	private get authorizationHeader() {
		return `Basic ${this.primaryServerAuth.username}:${this.primaryServerAuth.password}`
	}

	private outerHandleRequest(request: Request): PotentialPromise<Response> {
		// NOTE: Try not to mark this function as async..
		// Most javascript servers are way faster when they don't get promise responses

		const url = new URL(request.url)

		if (request.method === "OPTIONS") {
			// Handle CORS preflight requests
			const response = new Response(null, {
				status: 204,
				headers: {
					Vary: "Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
					"Access-Control-Allow-Origin": "*",
					"access-control-allow-methods": "GET,POST,HEAD,PUT,DELETE,PATCH",
					"Access-Control-Allow-Headers": "*",
				},
			})

			console.log(response.status, request.method, url.pathname)
			return response
		}

		const response = this.handleRequest(request, url.pathname)

		if (response instanceof Promise) {
			return response.then((response) =>
				this.addCorsHeaderAndLog(response, request, url as URL),
			)
		}

		return this.addCorsHeaderAndLog(response, request, url as URL)
	}

	private addCorsHeaderAndLog(
		response: Response,
		request: Request,
		url: URL,
	): Response {
		// Set CORS headers
		response.headers.set("Access-Control-Allow-Origin", "*")
		response.headers.set("Access-Control-Allow-Headers", "*")
		response.headers.set("Vary", "Origin")

		console.log(response.status, request.method, url.pathname)
		return response
	}

	private notFoundResponse() {
		return Response.json({ error: "404 Route not found" }, { status: 404 })
	}

	private unauthorizedResponse() {
		const error =
			"401 Unauthorized, either the authorization header is missing or incorrect. Expected `Basic <base64(apiKeyId:apiKey)>` where the apiKeyId is are the same as the scraper uses to authenticat with RT-CV"
		return Response.json({ error }, { status: 401 })
	}

	private requestValidAuth(authorization: string | null): Response | undefined {
		if (!authorization) return this.unauthorizedResponse()

		try {
			const [type, credentials] = authorization.split(" ")
			if (type !== "Basic") return this.unauthorizedResponse()
			const parsedCredentials = atob(credentials)
			if (!parsedCredentials) return this.unauthorizedResponse()
			const [username, password] = parsedCredentials.split(":")

			if (
				this.primaryServerAuth.username == username &&
				this.primaryServerAuth.password == password
			) {
				return undefined
			}

			if (
				this.alternativeServerAuth &&
				this.alternativeServerAuth.username == username &&
				this.alternativeServerAuth.password == password
			) {
				return undefined
			}
		} catch (e) {
			console.log("error parsing authorization header,", e)
		}

		return this.unauthorizedResponse()
	}

	private handleRequest(
		request: Request,
		pathname: string,
	): PotentialPromise<Response> {
		const authError = this.requestValidAuth(
			request.headers.get("Authorization"),
		)
		if (authError) return authError

		let apiHandler = resolveApiHandler(this.handlers, request.method, pathname)

		if (!apiHandler) {
			apiHandler = resolveExternalHandler(
				this.externalHandlers,
				request.method,
				pathname,
			)
		}

		if (!apiHandler) return this.notFoundResponse()

		const response = apiHandler(this, request)
		if (!response) return this.notFoundResponse()
		return response
	}

	private async setSlug() {
		console.log("Setting slug in rt-cv...")

		let slugResponse: {
			slug: string
			oldSlug: string
			overwroteExisting: boolean
		}
		try {
			slugResponse = await this.fetchWithRetry("/api/v1/scraper/setSlug", {
				method: "PUT",
				body: { slug: this.slug },
			})
		} catch (e) {
			console.log("error setting slug,", e)
			return
		}

		if (slugResponse.overwroteExisting) {
			console.log(
				`Warning: Overwrote existing slug ('${slugResponse.oldSlug}') with '${slugResponse.slug}'`,
			)
		}
	}

	private mightGetEnv(k: string): string {
		return process.env[k] || ""
	}

	private mustGetEnv(k: string): string {
		const v = this.mightGetEnv(k)
		if (!v) {
			throw "Missing required environment variable $" + k
		}
		return v
	}
}

function shuffle<T>(array: T[]) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[array[i], array[j]] = [array[j], array[i]]
	}

	return array
}
