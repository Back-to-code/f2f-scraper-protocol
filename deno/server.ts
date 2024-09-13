import { Handlers, PotentialPromise } from "../shared-typescript/handlers.ts"
import {
	AbstractServer,
	LangSpecifics,
	ServerOptions,
} from "../shared-typescript/server.ts"
import {
	AbstractGauge,
	type AbstractStats,
} from "../shared-typescript/stats.ts"
import {
	create,
	MetricsManager,
} from "https://deno.land/x/promts@v0.2.1/src/metricsmanager.ts"
import { Gauge } from "https://deno.land/x/promts@v0.2.1/mod.ts"

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
			let response: Response
			try {
				response = await handler(requestEvent.request)
			} catch (e) {
				console.error(e)
				response = Response.json(
					{ error: "Internal Server Error" },
					{
						status: 500,
					}
				)
			}

			try {
				await requestEvent.respondWith(response)
			} catch (e) {
				console.error("failed to respond", e)
			}
		}
	}
	statsServer(prefix: string, port: number): AbstractStats {
		const metrics = create()

		const stats = new StatsServer(prefix, metrics)

		this.httpServer(port, async (request: Request): Promise<Response> => {
			const url = new URL(request.url)
			if (url.pathname !== "/metrics") {
				return new Response("Not found", { status: 404 })
			}

			const metricsData = await metrics.toString()
			return new Response(metricsData)
		})

		console.log(`Serving stats on localhost:${port}/metrics`)

		return stats
	}
}

export class Server extends AbstractServer {
	constructor(slug: string, handlers: Handlers, options: ServerOptions) {
		super(new DenoLangSpecifics(), slug, handlers, options)
	}
}

export class StatsServer implements AbstractStats {
	constructor(
		public readonly prefix: string,
		public readonly registry: typeof MetricsManager
	) {}

	counter(name: string) {
		return this.registry.getCounter(this.prefix + name + "_count").with({})
	}

	gauge(name: string) {
		const gauge = this.registry
			.getGauge(this.prefix + name + "_gauge")
			.with({})
		return new GaugeImpl(gauge)
	}
}

export class GaugeImpl implements AbstractGauge {
	constructor(private gauge: Gauge) {}

	inc(amount?: number): void {
		this.gauge.inc(amount)
	}
	dec(amount?: number): void {
		this.gauge.dec(amount)
	}
	set(amount: number): void {
		this.gauge.reset()
		this.gauge.inc(amount)
	}
}
