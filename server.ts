import { Handlers } from './handlers.ts'

export interface ServerOptions {
    // If not set by env var required:
    apiServer?: string // If not set will try to use RTCV_SERVER env variable
    apiKeyId?: string // If not set will try to use RTCV_API_KEY_ID env variable
    apiKey?: string // If not set will try to use RTCV_API_KEY env variable

    // Optional:
    listen?: number // Default: 3000
    apiPrivateKey?: string // If not set will try to use RTCV_PRIVATE_KEY env variable
}

export class Server {
    private handlers: Handlers
    private listen: number
    private apiServer: string
    private authorizationHeader: string
    private privateKey: string | undefined

    constructor(handelers: Handlers, options: ServerOptions) {
        this.handlers = handelers
        this.listen = options.listen ?? 3000
        this.apiServer = mustGetEnv('RTCV_SERVER', options.apiServer)
        this.privateKey = mightGetEnv('RTCV_PRIVATE_KEY', options.apiPrivateKey) || undefined

        const apiKeyId = mustGetEnv('RTCV_API_KEY_ID', options.apiKeyId)
        const apiKey = mustGetEnv('RTCV_API_KEY', options.apiKey)
        this.authorizationHeader = `basic ${apiKeyId}:${apiKey}`

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
    public async fetch(path: string, method: RequestInit['method'] = 'GET', body?: unknown) {
        const fetchOptions: RequestInit = {
            method,
            headers: {
                'Accept': 'application/json',
                'Authorization': this.authorizationHeader,
            }
        }

        if (body) {
            fetchOptions.body = JSON.stringify(body)
            fetchOptions.headers = {
                ...fetchOptions.headers,
                'Content-Type': 'application/json',
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
        await this.fetch('/api/v1/health')
    }

    // startServer starts the server and listens for incoming connections
    public async startServer() {
        const s = Deno.listen({ port: this.listen })
        console.log(`Listening on http://localhost:${this.listen}/`)
        for await (const conn of s) {
            this.handleConn(conn)
        }
    }

    // ---
    // Private methods
    // ---

    private async handleConn(conn: Deno.Conn) {
        const httpConn = Deno.serveHttp(conn);
        for await (const requestEvent of httpConn) {
            this.handleRequest(requestEvent)
        }
    }

    private notFoundResponse() {
        return new Response('404 Route not found', { status: 404 })
    }

    private handleRequest({ request, respondWith }: Deno.RequestEvent) {
        const url = new URL(request.url)
        console.log(url.pathname)

        const handlers = this.handlers.getApiHandlers()
        const handler = handlers[`${request.method} ${url.pathname}`]
        if (!handler) respondWith(this.notFoundResponse())

        const response = handler(request)
        if (!response) return respondWith(this.notFoundResponse());
        respondWith(response)
    }
}

function mightGetEnv(k: string, defaultValue?: string): string {
    return defaultValue || Deno.env.get(k) || ''
}

function mustGetEnv(k: string, defaultValue?: string): string {
    const v = mightGetEnv(k, defaultValue)
    if (!v) {
        throw 'Missing required environment variable $' + k
    }
    return v
}
