import { Counter, Gauge, Registry } from "prom-client"

export class Stats {
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
