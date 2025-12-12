import { Server } from "./server.ts"

export class Slack {
	constructor(
		private internal: boolean,
		private server: Server,
	) {}

	async info(message: string, fields?: Record<string, unknown>) {
		await this.slackLog("info", message, fields)
	}

	async warn(message: string, fields?: Record<string, unknown>) {
		await this.slackLog("warn", message, fields)
	}

	async error(message: string, fields?: Record<string, unknown>) {
		await this.slackLog("error", message, fields)
	}

	// ---
	// Private methods
	// ---

	private async slackLog(
		level: "info" | "warn" | "error",
		message: string,
		fields?: Record<string, unknown>,
	) {
		try {
			await this.server.fetch("/api/v1/scraper/log", {
				method: "POST",
				body: {
					internal: this.internal,
					message,
					level,
					fields: fields ?? {},
				},
			})
		} catch (e) {
			console.warn("failed to log to slack:", e)
		}
	}
}
