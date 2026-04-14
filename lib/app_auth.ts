/**
 * Challenge-response authentication for the f2f-app.
 *
 * Flow:
 * 1. POST /api/tokens/challenge {nameSlug} -> {challenge}
 * 2. proof = lowercase(hex(sha512(challenge + secret)))
 * 3. POST /api/tokens/exchange {nameSlug, proof} -> {token}
 * 4. Cache token for 8 minutes (tokens are valid 10 min, 2 min buffer)
 */

const TOKEN_CACHE_DURATION_MS = 8 * 60 * 1000

export interface AppAuth {
	url: string // F2F_APP_URL
	keyId: string // F2F_APP_KEY_ID (= API token nameSlug)
	keySecret: string // F2F_APP_KEY_SECRET
}

export class AppTokenManager {
	private token: string | null = null
	private tokenExpiresAt: number = 0

	constructor(private auth: AppAuth) {}

	async getToken(): Promise<string> {
		if (this.token && Date.now() < this.tokenExpiresAt) {
			return this.token
		}

		return await this.authenticate()
	}

	private async authenticate(): Promise<string> {
		const base = this.auth.url + "/api/tokens"
		const headers = { "Content-Type": "application/json" }

		// 1. Request challenge
		const challengeRes = await fetch(`${base}/challenge`, {
			method: "POST",
			headers,
			body: JSON.stringify({ nameSlug: this.auth.keyId }),
		})
		if (!challengeRes.ok) throw new Error(`F2F App challenge failed (${challengeRes.status}): ${await challengeRes.text()}`)
		const { challenge } = await challengeRes.json() as { challenge: string }

		// 2. Calculate proof (SHA-512)
		const msgUint8 = new TextEncoder().encode(challenge + this.auth.keySecret)
		const hashBuffer = await crypto.subtle.digest("SHA-512", msgUint8)
		const hashArray = Array.from(new Uint8Array(hashBuffer))
		const proof = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

		// 3. Exchange for token
		const tokenRes = await fetch(`${base}/exchange`, {
			method: "POST",
			headers,
			body: JSON.stringify({ nameSlug: this.auth.keyId, proof }),
		})
		if (!tokenRes.ok) throw new Error(`F2F App token exchange failed (${tokenRes.status}): ${await tokenRes.text()}`)
		const { token } = await tokenRes.json() as { token: string }

		// 4. Cache token
		this.token = token
		this.tokenExpiresAt = Date.now() + TOKEN_CACHE_DURATION_MS

		return token
	}
}
