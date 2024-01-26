import {
	Handlers,
	PotentialPromise,
	LangSpecifics,
	ServerOptions,
} from "../index.ts"
import { AbstractServer } from "../shared-typescript/server.ts"
import { type AbstractStats } from "../shared-typescript/stats.ts"
import { Registry, Counter, Gauge } from "prom-client"

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
	statsServer(prefix: string, port: number): AbstractStats {
		const register = new Registry()
		const stats = new StatsServer(prefix, register)

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
}

export class Server extends AbstractServer {
	constructor(slug: string, handlers: Handlers, options: ServerOptions) {
		super(new BunLangSpecifics(), slug, handlers, options)
	}
}

export class StatsServer implements AbstractStats {
	public readonly prefix: string
	public readonly registry: Registry

	constructor(prefix: string, registry: Registry) {
		this.prefix = prefix
		this.registry = registry
	}

	counter(name: string) {
		const counter = new Counter({
			name: this.prefix + name + "_count",
			help: this.prefix + name + "_help",
		})
		this.registry.registerMetric(counter)
		return counter
	}
	gauge(name: string) {
		const csvCacheSize = new Gauge({
			name: this.prefix + name + "_gauge",
			help: this.prefix + name + "_help",
		})
		this.registry.registerMetric(csvCacheSize)
		return csvCacheSize
	}
}
