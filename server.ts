import { resolveApiHandler, Handlers } from "./handlers.ts"
import type { Cv } from "./cv.ts"

export interface ServerOptions {
	// If not set by env var required:
	apiServer?: string // If not set will try to use RTCV_SERVER env variable
	apiKeyId?: string // If not set will try to use RTCV_API_KEY_ID env variable
	apiKey?: string // If not set will try to use RTCV_API_KEY env variable

	// Optional:
	port?: number // If not set will try to use SERVER_PORT or default to: 3000
	apiPrivateKey?: string // If not set will try to use RTCV_PRIVATE_KEY env variable
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
	private privateKey: string | undefined

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
		this.apiServer = mustGetEnv("RTCV_SERVER", options.apiServer)
		this.privateKey =
			mightGetEnv("RTCV_PRIVATE_KEY", options.apiPrivateKey) || undefined

		this.apiKeyId = mustGetEnv("RTCV_API_KEY_ID", options.apiKeyId)
		const apiKey = mustGetEnv("RTCV_API_KEY", options.apiKey)
		this.authorizationHeader = `Basic ${this.apiKeyId}:${apiKey}`

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

		if (options.body) {
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
		if (!this.privateKey)
			throw "Missing private key, set the $RTCV_PRIVATE_KEY env variable or provide it in the server options"

		const { users } = await this.fetch(
			"/api/v1/scraperUsers/" + this.apiKeyId,
			{
				headers: {
					"X-RT-CV-Private-Key": this.privateKey,
				},
			}
		)

		if (users.length == 0 && mustBeAtLeastOneUser) throw "No login users found"

		return users
	}

	// Send a scraped CV to RT-CV
	public async sendCv(cv: Cv) {
		const body = { cv }
		await this.fetch("/api/v1/scraper/scanCV", { body, method: "POST" })
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
		if (!apiHandler) respondWith(this.notFoundResponse())

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
