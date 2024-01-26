export abstract class AbstractStats {
	abstract counter(name: string): AbstractCounter
	abstract gauge(name: string): AbstractGauge
}

export abstract class AbstractCounter {
	abstract inc(amount?: number): void
}

export abstract class AbstractGauge {
	abstract inc(amount?: number): void
	abstract dec(amount?: number): void
	abstract set(amount: number): void
}
