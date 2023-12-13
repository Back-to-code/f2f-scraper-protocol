import { Handlers, PotentialPromise } from "../shared-typescript/handlers.ts"
import {
	AbstractServer,
	LangSpecifics,
	ServerOptions,
} from "../shared-typescript/server.ts"

class DenoLangSpecifics implements LangSpecifics {
	exit1(): never {
		Deno.exit(1)
	}
	getEnv(k: string): string | undefined {
		return Deno.env.get(k)
	}
	async httpServer(
		port: number,
		handler: (request: Request) => PotentialPromise<Response>
	): Promise<void> {
		const s = Deno.listen({ port })
		for await (const conn of s) {
			this.handleConn(conn, handler)
		}
	}
	async handleConn(
		conn: Deno.Conn,
		handler: (request: Request) => PotentialPromise<Response>
	) {
		const httpConn = Deno.serveHttp(conn)
		for await (const requestEvent of httpConn) {
			await requestEvent.respondWith(handler(requestEvent.request))
		}
	}
}

export class Server extends AbstractServer {
	constructor(slug: string, handlers: Handlers, options: ServerOptions) {
		super(new DenoLangSpecifics(), slug, handlers, options)
	}
}
