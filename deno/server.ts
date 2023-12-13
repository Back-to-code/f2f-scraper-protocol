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
	httpServer(
		port: number,
		handler: (request: Request) => PotentialPromise<Response>
	): Promise<void> {
		return Deno.serve({ port }, handler).finished
	}
}

export class Server extends AbstractServer {
	constructor(slug: string, handlers: Handlers, options: ServerOptions) {
		super(new DenoLangSpecifics(), slug, handlers, options)
	}
}
