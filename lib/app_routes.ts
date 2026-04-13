/**
 * Maps RT-CV API paths to f2f-app proxy paths.
 * Static paths are looked up by exact match.
 * Parameterized paths are matched by prefix — the dynamic suffix carries over.
 */

const staticRoutes: Record<string, string> = {
	"/api/v1/health": "/api/private/scraper/health",
	"/api/v1/scraper/status": "/api/private/scraper/status",
	"/api/v1/scraper/setSlug": "/api/private/scraper/set-slug",
	"/api/v1/scraper/scanCV": "/api/private/scraper/scan-cv",
	"/api/v1/scraper/dryScanCV": "/api/private/scraper/dry-scan-cv",
	"/api/v1/scraper/scanCVDocument": "/api/private/scraper/scan-cv-document",
	"/api/v1/scraper/allCVs": "/api/private/scraper/all-cvs",
	"/api/v1/scraper/log": "/api/private/scraper/log",
	"/api/v1/scraperUsers": "/api/private/scraper/users",
	"/api/v1/scraperUsers/reportLoginAttempt":
		"/api/private/scraper/users/report-login-attempt",
	"/api/v1/scraperUsers/userValidity":
		"/api/private/scraper/users/user-validity",
	"/api/v1/candidates": "/api/private/scraper/candidates",
}

// Prefix-based routes for paths with dynamic segments.
// Order matters — more specific prefixes first.
const prefixRoutes: Array<[string, string]> = [
	["/api/v1/siteStorageCredentials/scraper/", "/api/private/scraper/site-storage-credentials/"],
	["/api/v1/siteStorageCredentials/", "/api/private/scraper/site-storage-credentials/"],
	["/api/v1/visitedCvs/byReference/", "/api/private/scraper/visited-cvs/by-reference/"],
]

export function mapRtcvPathToAppPath(rtcvPath: string): string {
	const staticMatch = staticRoutes[rtcvPath]
	if (staticMatch) return staticMatch

	for (const [from, to] of prefixRoutes) {
		if (rtcvPath.startsWith(from)) {
			return to + rtcvPath.slice(from.length)
		}
	}

	console.warn(
		`[F2F_APP] No route mapping for path: ${rtcvPath}, passing through unchanged`,
	)
	return rtcvPath
}
