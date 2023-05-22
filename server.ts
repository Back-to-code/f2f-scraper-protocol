import { resolveApiHandler, Handlers } from "./handlers.ts"
import type { Cv } from "./cv.ts"

export interface ServerOptions {
	// If not set by env var required:
	apiServer?: string // If not set will try to use RTCV_SERVER env variable
	// Optional:
	port?: number // If not set will try to use SERVER_PORT or default to: 3000
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

export class Server {
	private handlers: Handlers
	private port: number
	private apiServer: string
	private apiKeyId: string
	private authorizationHeader: string

	constructor(handelers: Handlers, options: ServerOptions) {
		this.handlers = handelers

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

		this.apiKeyId = apiServer.username
		this.apiServer = apiServer.origin

		this.authorizationHeader = `Basic ${apiServer.username}:${apiServer.password}`

		// Health check the RT-CV server
		this.health().catch((e) => {
			console.log("Failed to ping RT-CV, error:")
			console.log(e)
			Deno.exit(1)
		})
	}

	// ---
	// Public methods
	// ---

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

		if (options.body && options.body instanceof FormData) {
			fetchOptions.body = options.body
			// Content-Type will be set automatically by the fetch method
		} else {
			fetchOptions.body = JSON.stringify(options.body)
			fetchOptions.headers = {
				...fetchOptions.headers,
				"Content-Type": "application/json",
			}
		}

		const r = await fetch(this.apiServer + path, fetchOptions)
		if (r.status >= 400) {
			const response = await r.text()
			throw `failed to make request to ${path}, error response: ${response}`
		}

		return r.json()
	}

	// health checks if the api server is up and running and if not throws an error
	public async health() {
		await this.fetch("/api/v1/health")
	}

	// get all login users for the api key
	public async getUsers(
		mustBeAtLeastOneUser: boolean
	): Promise<Array<LoginUser>> {
		const { users } = await this.fetch("/api/v1/scraperUsers/" + this.apiKeyId)

		if (users.length == 0 && mustBeAtLeastOneUser) throw "No login users found"

		const usersWithoutPasswords = users.filter(
			(user: LoginUser) => !user.password
		).length
		if (users.length > 0 && usersWithoutPasswords === users.length) {
			throw "This key uses a unsupported and deprecated scraper user encryption method, please convert your users to the new encryption method via the RT-CV dashboard"
		}

		return users
	}

	// Send a scraped CV to RT-CV
	public async sendCv(cv: Cv) {
		const body = { cv }
		await this.fetch("/api/v1/scraper/scanCV", { body, method: "POST" })
	}

	// sendCvDocument sends a CV document to RT-CV
	public async sendCvDocument(metadata: Cv, cvFile: Blob) {
		const body = new FormData()

		body.set("metadata", JSON.stringify(metadata))
		body.set("cv", cvFile, "cv.pdf")

		await this.fetch("/api/v1/scraper/scanCVDocument", { body, method: "POST" })
	}

	// startServer starts the server and listens for incoming connections
	public async startServer() {
		const s = Deno.listen({ port: this.port })
		console.log(`Listening on http://localhost:${this.port}/`)
		for await (const conn of s) {
			this.handleConn(conn)
		}
	}

	// ---
	// Private methods
	// ---

	private async handleConn(conn: Deno.Conn) {
		const httpConn = Deno.serveHttp(conn)
		for await (const requestEvent of httpConn) {
			this.handleRequest(requestEvent)
		}
	}

	private notFoundResponse() {
		return new Response("404 Route not found", { status: 404 })
	}

	private handleRequest({ request, respondWith }: Deno.RequestEvent) {
		const url = new URL(request.url)
		console.log(url.pathname)

		const apiHandler = resolveApiHandler(
			this.handlers,
			request.method,
			url.pathname
		)
		if (!apiHandler) return respondWith(this.notFoundResponse())

		const response = apiHandler(request)
		if (!response) return respondWith(this.notFoundResponse())
		respondWith(response)
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
