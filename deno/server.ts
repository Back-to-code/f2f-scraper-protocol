import {
	CustomHandler,
	CustomHandlerCallback,
	Handlers,
	resolveApiHandler,
	resolveExternalHandler,
} from "./handlers.ts"
import type { Cv } from "./cv.ts"

export interface ServerOptions {
	// Required (If not set by env variables):
	apiServer?: string // If not set will try to use RTCV_SERVER env variable

	// Optional:
	alternativeServer?: string | false // If not set will try to use RTCV_ALTERNATIVE_SERVER env variable, if set to false will disable alternative server
	port?: number // If not set will try to use SERVER_PORT or default to: 3000
	noHealthChecks?: boolean // If set to true will disable health checks on the RT-CV server
	skipSlugCheck?: boolean // If set to true will not check and update the slug on the RT-CV server

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

interface ServerAuth {
	username: string
	password: string
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

export class Server {
	private handlers: Handlers
	private port: number
	private apiServer: string
	private apiKeyId: string
	private primaryServerAuth: ServerAuth
	private alternativeServerAuth?: ServerAuth
	private alternativeServer?: Server
	private externalHandlers: Map<string, CustomHandlerCallback> = new Map()

	constructor(slug: string, handlers: Handlers, options: ServerOptions) {
		this.handlers = handlers

		const potentialsServerPort = mightGetEnv("SERVER_PORT")
		if (potentialsServerPort) {
			this.port = Number(potentialsServerPort)
			if (Number.isNaN(this.port)) {
				console.log("the $SERVER_PORT shell variable is not a number")
			}
		} else {
			this.port = options.port ?? 3000
		}
		const apiServer = new URL(mustGetEnv("RTCV_SERVER", options.apiServer))
		if (!apiServer.username || !apiServer.password) {
			console.log(
				"RTCV_SERVER url must contain api credentials like: https://key_id:key@example.com"
			)
			Deno.exit(1)
		}

		if (slug === "" && !options.skipSlugCheck) {
			console.log(
				"Error: slug is required for the scraper to be identifiable! If you are sure that you want to run the scraper without a slug, use the skipSlugCheck option in options."
			)
			Deno.exit(1)
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
				Deno.exit(1)
			})
		}

		if (!options.skipSlugCheck) this.setSlug(slug)

		if (options.customHandlers) {
			try {
				this.addCustomHandler(options.customHandlers)
			} catch (e) {
				console.log("Failed to add external handlers, error:", e)
				Deno.exit(1)
			}
		}

		if (options.alternativeServer !== false) {
			const alternativeServer = mightGetEnv(
				"RTCV_ALTERNATIVE_SERVER",
				options.alternativeServer
			)
			if (alternativeServer) {
				const alternativeServerUrl = new URL(alternativeServer)
				if (
					alternativeServerUrl.username &&
					alternativeServerUrl.password
				) {
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
					}
				)
			}
		}
	}

	private get authorizationHeader() {
		return `Basic ${this.primaryServerAuth.username}:${this.primaryServerAuth.password}`
	}

	// ---
	// Public methods
	// ---

	public async fetchWithRetry(path: string, options: FetchOptions = {}) {
		let retries = 0
		while (true) {
			try {
				return await this.fetch(path, options)
			} catch (e) {
				if (
					e instanceof FetchError &&
					e.status >= 400 &&
					e.parsedResponse &&
					e.parsedResponse?.kind === "INPUT_VALIDATION"
				) {
					// This request wil keep failing as there is an error on our end, so we should not retry
					throw e
				}

				if (retries < 3) {
					retries++
					const waitSeconds = retries * 3
					console.log(
						`failed to fetch ${path}, retrying in ${waitSeconds} second`
					)
					await new Promise((resolve) =>
						setTimeout(resolve, waitSeconds * 1000)
					)
				} else {
					throw e
				}
			}
		}
	}

	// Make a request to RT-CV
	// Returns the response decoded as JSOn
	public async fetch(path: string, options: FetchOptions = {}) {
		const fetchOptions: RequestInit = {
			method: options.method,
			headers: {
				...options.headers,
				Accept: "application/json",
				Authorization: this.authorizationHeader,
			},
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
		if (r.status >= 400) {
			throw new FetchError(await r.text(), path, r.status)
		}

		return r.json()
	}

	// health checks if the api server is up and running and if not throws an error
	public async health() {
		await this.fetchWithRetry("/api/v1/health")
	}

	// get all login users for the api key
	public async getUsers(
		mustBeAtLeastOneUser: boolean
	): Promise<Array<LoginUser>> {
		const { users } = await this.fetchWithRetry("/api/v1/scraperUsers")

		if (users.length == 0 && mustBeAtLeastOneUser) {
			throw "No login users found"
		}

		const usersWithoutPasswords = users.filter(
			(user: LoginUser) => !user.password
		).length
		if (users.length > 0 && usersWithoutPasswords === users.length) {
			throw "This key uses a unsupported and deprecated scraper user encryption method, please convert your users to the new encryption method via the RT-CV dashboard"
		}

		return this.shuffle(users)
	}

	public async reportLoginSuccess(usernameOrUser: string | LoginUser) {
		return await this.reportLoginAttempt(usernameOrUser, true)
	}

	public async reportLoginFailure(usernameOrUser: string | LoginUser) {
		return await this.reportLoginAttempt(usernameOrUser, false)
	}

	public async reportLoginAttempt(
		usernameOrUser: string | LoginUser,
		success: boolean
	) {
		const username =
			typeof usernameOrUser === "string"
				? usernameOrUser
				: usernameOrUser.username

		try {
			await this.fetchWithRetry(
				"/api/v1/scraperUsers/reportLoginAttempt",
				{
					method: "POST",
					body: {
						username,
						success,
					},
				}
			)
		} catch (e) {
			console.warn(
				`failed to report login ${
					success ? "success" : "failure"
				} for user "${username}", error:`,
				e
			)
		}
		await this.alternativeServer?.reportLoginAttempt(
			usernameOrUser,
			success
		)
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
				"/api/v1/siteStorageCredentials/scraper/" + this.apiKeyId
			)

		if (!Array.isArray(credentials)) {
			throw `Unexpected RT-CV response for site credentials, expected array but got ${JSON.stringify(
				credentials
			)}`
		}

		const valid = []
		const invalid = []
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
		credential: SiteStorageCredentials
	): Promise<SiteStorageCredentials> {
		return this.fetchWithRetry(
			"/api/v1/siteStorageCredentials/" + credential.id + "/invalidate",
			{ method: "PATCH" }
		)
	}

	// sets the invalid flag of a site storage credential to **false**
	public validateSiteStorageCredential(
		credential: SiteStorageCredentials
	): Promise<SiteStorageCredentials> {
		return this.fetchWithRetry(
			"/api/v1/siteStorageCredentials/" + credential.id + "/validate",
			{ method: "PATCH" }
		)
	}

	private shuffle<T>(array: T[]) {
		for (let i = array.length - 1; i > 0; i--) {
			let j = Math.floor(Math.random() * (i + 1))
			;[array[i], array[j]] = [array[j], array[i]]
		}

		return array
	}

	private validateCv(cv: Cv) {
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

	// Send a scraped CV to RT-CV
	public async sendCv(cv: Cv, preValidation = true) {
		if (preValidation) this.validateCv(cv)

		this.alternativeServer?.sendCv(cv, false).catch((e) => {
			console.log("failed to send cv to alternative server,", e)
		})

		await this.fetchWithRetry("/api/v1/scraper/scanCV", {
			body: { cv },
			method: "POST",
		})
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
	public async sendCvDocument(metadata: Cv, cvFile: Blob) {
		this.alternativeServer?.sendCvDocument(metadata, cvFile).catch((e) => {
			console.log("failed to send cv document to alternative server,", e)
		})
		const body = new FormData()

		body.set("metadata", JSON.stringify(metadata))
		body.set("cv", cvFile, "cv.pdf")

		await this.fetchWithRetry("/api/v1/scraper/scanCVDocument", {
			body,
			method: "POST",
		})
	}

	// startServer starts the server and listens for incoming connections
	public async startServer() {
		const s = Deno.listen({ port: this.port })
		console.log(`Listening on http://localhost:${this.port}/`)
		for await (const conn of s) {
			this.handleConn(conn)
		}
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
				throw new Error(
					`Handler already exists for ${methodPathString}`
				)
			}

			this.externalHandlers.set(methodPathString, handlerFunc)
		}
	}

	// ---
	// Private methods
	// ---

	private async handleConn(conn: Deno.Conn) {
		const httpConn = Deno.serveHttp(conn)
		for await (const { request, respondWith } of httpConn) {
			const url = new URL(request.url)

			if (request.method === "OPTIONS") {
				// Handle CORS preflight requests
				const response = new Response(null, {
					status: 204,
					headers: {
						Vary: "Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
						"Access-Control-Allow-Origin": "*",
						"access-control-allow-methods":
							"GET,POST,HEAD,PUT,DELETE,PATCH",
						"Access-Control-Allow-Headers": "*",
					},
				})

				console.log(response.status, request.method, url.pathname)
				respondWith(response)
				continue
			}

			const response = await this.handleRequest(request, url.pathname)

			// Set CORS headers
			response.headers.set("Access-Control-Allow-Origin", "*")

			response.headers.set("Access-Control-Allow-Headers", "*")
			response.headers.set("Vary", "Origin")

			console.log(response.status, request.method, url.pathname)
			respondWith(response)
		}
	}

	private notFoundResponse() {
		return Response.json({ error: "404 Route not found" }, { status: 404 })
	}

	private unauthorizedResponse() {
		const error =
			"401 Unauthorized, either the authorization header is missing or incorrect. Expected `Basic <base64(apiKeyId:apiKey)>` where the apiKeyId is are the same as the scraper uses to authenticat with RT-CV"
		return Response.json({ error }, { status: 401 })
	}

	private requestValidAuth(
		authorization: string | null
	): Response | undefined {
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

	private async handleRequest(
		request: Request,
		pathname: string
	): Promise<Response> {
		const authError = this.requestValidAuth(
			request.headers.get("Authorization")
		)
		if (authError) return authError

		let apiHandler = resolveApiHandler(
			this.handlers,
			request.method,
			pathname
		)

		if (!apiHandler) {
			apiHandler = resolveExternalHandler(
				this.externalHandlers,
				request.method,
				pathname
			)
		}

		if (!apiHandler) return this.notFoundResponse()

		const response = apiHandler(request)
		if (!response) return this.notFoundResponse()
		return await response
	}

	private async setSlug(slug: string) {
		console.log("Setting slug in rt-cv...")

		let slugResponse: {
			slug: string
			oldSlug: string
			overwroteExisting: boolean
		}
		try {
			slugResponse = await this.fetchWithRetry(
				"/api/v1/scraper/setSlug",
				{
					method: "PUT",
					body: { slug: slug },
				}
			)
		} catch (e) {
			console.log("error setting slug,", e)
			return
		}

		if (slugResponse.overwroteExisting) {
			console.log(
				`Warning: Overwrote existing slug ('${slugResponse.oldSlug}') with '${slugResponse.slug}'`
			)
		}
	}
}

function mightGetEnv(k: string, defaultValue?: string): string {
	return defaultValue || Deno.env.get(k) || ""
}

function mustGetEnv(k: string, defaultValue?: string): string {
	const v = mightGetEnv(k, defaultValue)
	if (!v) {
		throw "Missing required environment variable $" + k
	}
	return v
}
