export type ExternalHandlerCallback = (
	request: Request
) => PotentialPromise<Response>

export interface ExternalHandler {
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
	path: string
	handler: ExternalHandlerCallback
}

export type PotentialPromise<T> = T | Promise<T>

export interface Handlers {
	checkCredentials?: (
		username: string,
		password: string
	) => PotentialPromise<boolean>
}

type ApiHandler = (request: Request) => Response | Promise<Response>
type ApiHandlers = Record<string, ApiHandler>

const notImplementedResponse = () =>
	new Response("Not Implemented", { status: 404 })

export function resolveApiHandler(
	handlers: Handlers,
	method: string,
	path: string
): ApiHandler | undefined {
	return apiHandlers(handlers)[`${method} ${path}`]
}

function apiHandlers(handlers: Handlers): ApiHandlers {
	return {
		"GET /health": () => Response.json({ status: "ok" }, { status: 200 }),
		"POST /check-credentials": async (request) => {
			if (!handlers.checkCredentials) {
				return notImplementedResponse()
			}

			const body = request.json()

			const bodyError = () =>
				new Response("Expected a body with a username and password", {
					status: 400,
				})

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
					body.username,
					body.password
				)
				return Response.json({ valid })
			} catch (e) {
				console.log("Failed to check credentials, error:")
				console.log(e)
				return Response.json(
					{ error: "Failed to check credentials" },
					{ status: 500 }
				)
			}
		},
	}
}

// Finds the handler for the given method and path, or returns undefined if there is
// no handler.
export function resolveExternalHandler(
	handlers: Map<string, ExternalHandlerCallback>,
	method: string,
	path: string
): ApiHandler | undefined {
	if (handlers.has(`${method} ${path}`)) {
		return handlers.get(`${method} ${path}`)!
	}

	return undefined
}
