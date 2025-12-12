import type { Gauge } from "prom-client"
import type { Cv } from "./cv.ts"
import type { Stats } from "./stats.ts"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface CvWithTime {
	cv: Cv
	ttl: number
}

export class CvCache {
	private cvs: Map<string, CvWithTime> = new Map()
	private startedCleanupLoop = false
	private statsGauge?: Gauge

	constructor(stats?: Stats) {
		this.statsGauge = stats?.gauge("csv_cache_size")
	}

	set stats(stats: Stats | undefined) {
		this.statsGauge = stats?.gauge("csv_cache_size")
	}

	store(cv: Cv) {
		this.cleanupLoop()

		const now = new Date()
		now.setHours(now.getHours() + 16)

		this.cvs.set(cv.referenceNumber!, {
			cv,
			ttl: now.getTime(),
		})

		this.statsGauge?.set(this.cvs.size)
	}

	has(referenceNumber: string): Cv | undefined {
		const cacheEntry = this.cvs.get(referenceNumber)
		if (!cacheEntry) return undefined

		if (cacheEntry.ttl < Date.now()) {
			this.cvs.delete(referenceNumber)
			this.statsGauge?.set(this.cvs.size)
			return undefined
		}

		return cacheEntry.cv
	}

	private async cleanupLoop() {
		if (this.startedCleanupLoop) {
			return
		}
		this.startedCleanupLoop = true

		console.log("starting cleanup loop")
		while (true) {
			await sleep(30 * 60 * 1_000) // 30 minutes
			console.log("cleaning up cache")

			const now = Date.now()
			for (const [key, value] of this.cvs.entries()) {
				if (value.ttl < now) {
					this.cvs.delete(key)
				}
			}

			this.statsGauge?.set(this.cvs.size)
		}
	}
}
