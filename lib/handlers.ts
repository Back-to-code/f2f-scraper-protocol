import { Cv } from "./cv.ts"
import { formatCvFilename } from "./cv_document.ts"
import { Server, SiteStorageCredentialsValue } from "./server.ts"

export type PotentialPromise<T> = T | Promise<T>

export type CustomHandlerCallback = (
	server: Server,
	request: Request,
) => PotentialPromise<Response>

type ApiHandler = (
	server: Server,
	request: Request,
) => PotentialPromise<Response>
type ApiHandlers = Record<string, ApiHandler>

export interface CustomHandler {
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
	path: string
	handler: CustomHandlerCallback
}

export interface Handlers {
	cv?: (
		server: Server,
		referenceNr: string,
	) => PotentialPromise<{ cv: Cv; hasDocument?: boolean }>
	cvDocument?: (
		server: Server,
		referenceNr: string,
	) => PotentialPromise<{
		data: Uint8Array
		filename?: string
		mimeType?: string
	}>
	checkCredentials?: (
		server: Server,
		username: string,
		password: string,
	) => PotentialPromise<boolean>
	checkSiteStorageCredentials?: (
		server: Server,
		credentials: SiteStorageCredentialsValue,
	) => PotentialPromise<boolean>
	health?: (server: Server) => PotentialPromise<string[] | undefined>
}

interface BaseHealthResponse {
	// iso timestamp with time of last send cv if it has been send
	lastSentCv: string | null
}

interface HealthyResponse extends BaseHealthResponse {
	// Indicates if everything is oke, true = http status 200, false = http status 500
	status: true
}

interface UnhealthyResponse extends BaseHealthResponse {
	// Indicates if everything is oke, true = http status 200, false = http status 500
	status: false

	// A list of errors that might be reported by a scraper
	errors: string[]
}

const notImplementedResponse = () =>
	Response.json(
		{ error: "Not Implemented" },
		{
			status: 404,
			headers: {
				"X-Not-Implemented": "true",
			},
		},
	)

export function resolveApiHandler(
	handlers: Handlers,
	method: string,
	path: string,
): ApiHandler | undefined {
	return apiHandlers(handlers)[`${method} ${path}`]
}

function apiHandlers(handlers: Handlers): ApiHandlers {
	return {
		"GET /health": async (server) => {
			if (!handlers.health) {
				return Response.json({
					status: true,
					lastSentCv: server.lastSentCv?.toISOString() ?? null,
				} satisfies HealthyResponse)
			}

			const errorResponse: UnhealthyResponse = {
				status: false,
				lastSentCv: server.lastSentCv?.toISOString() ?? null,
				errors: [],
			}

			try {
				const scraperErrors = await handlers.health(server)

				if (!scraperErrors || scraperErrors.length === 0) {
					return Response.json({
						status: true,
						lastSentCv: server.lastSentCv?.toISOString() ?? null,
					} satisfies HealthyResponse)
				}

				errorResponse.errors = scraperErrors
			} catch (e) {
				console.log("Failed to check scraper health, error:")
				console.log(e)

				errorResponse.errors = [e as string]
			}

			return Response.json(errorResponse, { status: 500 })
		},
		"POST /cv": async (server, request) => {
			if (!handlers.cv) {
				return notImplementedResponse()
			}

			const referenNrOrError = await referenceNrFromBody(request)
			if (referenNrOrError instanceof Response) {
				// referenNrOrError is an error
				return referenNrOrError
			}

			try {
				const response = await handlers.cv(server, referenNrOrError)
				return Response.json(response)
			} catch (e) {
				console.log("Failed to fetch cv, error: ", e)
				return Response.json(
					{ error: "Failed to fetch cv by reference number" },
					{ status: 500 },
				)
			}
		},
		"POST /cv-document": async (server, request) => {
			if (!handlers.cvDocument) {
				return notImplementedResponse()
			}

			const referenNrOrError = await referenceNrFromBody(request)
			if (referenNrOrError instanceof Response) {
				// is error
				return referenNrOrError
			}

			try {
				const cvDocument = await handlers.cvDocument(server, referenNrOrError)

				const headers: Record<string, string> = {}

				headers["Filename"] = formatCvFilename(
					cvDocument.filename,
					cvDocument.mimeType,
				)
				if (cvDocument.mimeType) {
					headers["Content-Type"] = cvDocument.mimeType
				}

				return new Response(cvDocument.data, { headers })
			} catch (e) {
				console.log("Failed to fetch cv document, error: ", e)
				return Response.json(
					{
						error: "Failed to fetch cv document by reference number",
					},
					{ status: 500 },
				)
			}
		},
		"POST /check-credentials": async (server, request) => {
			if (!handlers.checkCredentials) {
				return notImplementedResponse()
			}

			const body = await request.json()

			const bodyError = () =>
				Response.json(
					{ error: "Expected a body with a username and password" },
					{ status: 400 },
				)

			if (typeof body !== "object" || body === null) {
				return bodyError()
			}
			if (!("username" in body) || typeof body.username !== "string") {
				return bodyError()
			}
			if (!("password" in body) || typeof body.password !== "string") {
				return bodyError()
			}

			try {
				const valid = await handlers.checkCredentials(
					server,
					body.username,
					body.password,
				)
				return Response.json({ valid })
			} catch (e) {
				console.log("Failed to check credentials, error: ", e)
				return Response.json(
					{ error: "Failed to check credentials" },
					{ status: 500 },
				)
			}
		},
		"POST /check-site-storage-credentials": async (server, request) => {
			if (!handlers.checkSiteStorageCredentials) {
				return notImplementedResponse()
			}

			let body
			try {
				body = (await request.json()) as SiteStorageCredentialsValue
			} catch (e) {
				return Response.json(
					{ error: `Failed to parse body, error: ${e}` },
					{ status: 400 },
				)
			}

			const bodyError = (error: string) =>
				Response.json(
					{ error: `Failed to parse body, error: ${error}` },
					{ status: 400 },
				)

			if (typeof body !== "object" || body === null) {
				return bodyError("body is not an object")
			}

			if ("cookies" in body && body.cookies) {
				if (typeof body.cookies !== "object") {
					return bodyError("body.cookies is not an object")
				}

				if (Object.keys(body.cookies).length === 0) {
					return bodyError("body.cookies is empty")
				}

				for (const [cookieName, cookieValue] of Object.entries(body.cookies)) {
					if (!Array.isArray(cookieValue)) {
						return bodyError("body.cookies[cookieName] is not an array")
					}
					for (const value of cookieValue) {
						if (typeof value !== "string") {
							return bodyError(
								"body.cookies[cookieName] contains a non-string value",
							)
						}
					}

					if (typeof cookieName !== "string") {
						return bodyError("body.cookies contains a non-string key")
					}
				}
			}

			try {
				const valid = await handlers.checkSiteStorageCredentials(server, body)
				return Response.json({ valid })
			} catch (e) {
				console.log("Failed to check credentials, error:")
				console.log(e)
				return Response.json(
					{ error: "Failed to check credentials" },
					{ status: 500 },
				)
			}
		},
	}
}

// Finds the handler for the given method and path, or returns undefined if there is
// no handler.
export function resolveExternalHandler(
	handlers: Map<string, CustomHandlerCallback>,
	method: string,
	path: string,
): ApiHandler | undefined {
	return handlers.get(`${method} ${path}`)
}

async function referenceNrFromBody(
	request: Request,
): Promise<string | Response> {
	const body = await request.json()

	const bodyError = () =>
		Response.json(
			{ error: "Expected a body with a referenceNr" },
			{ status: 400 },
		)

	if (typeof body !== "object" || body === null) {
		return bodyError()
	}

	if (!("referenceNr" in body)) {
		return bodyError()
	}

	if (typeof body.referenceNr !== "string") {
		if (typeof body.referenceNr === "number") {
			return body.referenceNr.toString()
		} else {
			return bodyError()
		}
	}

	return body.referenceNr
}
