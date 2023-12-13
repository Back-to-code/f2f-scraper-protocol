import {
	Handlers,
	PotentialPromise,
	LangSpecifics,
	ServerOptions,
} from "../index.ts"
import { AbstractServer } from "../shared-typescript/server.ts"

class BunLangSpecifics implements LangSpecifics {
	exit1(): never {
		process.exit(1)
	}
	getEnv(k: string): string | undefined {
		return process.env[k]
	}
	httpServer(
		port: number,
		handler: (request: Request) => PotentialPromise<Response>
	): Promise<void> {
		Bun.serve({
			port,
			fetch: (request: Request) => handler(request),
		})
		return new Promise(() => {})
	}
}

export class Server extends AbstractServer {
	constructor(slug: string, handlers: Handlers, options: ServerOptions) {
		super(new BunLangSpecifics(), slug, handlers, options)
	}
}
