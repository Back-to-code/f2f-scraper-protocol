export type ApiHandler = (request: Request) => (Response | Promise<Response>)
export type ApiHandlers = Record<string, ApiHandler>

const notImplementedText = 'Not Implemented'
const NotImplementedResponse = () => new Response(notImplementedText, { status: 404 })

export abstract class Handlers {
    constructor() { }

    getApiHandlers(): ApiHandlers {
        return {
            'GET /health': () => Response.json({ status: 'ok' }, { status: 200 }),
            'POST /check-credentials': async (request) => {
                const body = request.json()

                const bodyError = () => new Response('Expected a body with a username and password', { status: 400 })

                if (typeof body !== 'object' || body === null) {
                    return bodyError()
                }
                if (!('username' in body) || typeof body.username !== 'string') {
                    return bodyError()
                }
                if (!('password' in body) || typeof body.password !== 'string') {
                    return bodyError()
                }

                try {
                    const valid = await this.checkCredentials(body.username, body.password)
                    return Response.json({ valid }, { status: valid ? 200 : 401 })
                } catch (e) {
                    if (typeof e === 'string' && e === notImplementedText) {
                        return NotImplementedResponse()
                    }

                    console.log("Failed to check credentials, error:")
                    console.log(e)
                    return Response.json({ error: 'Failed to check credentials' }, { status: 500 })
                }
            },
        }
    }

    checkCredentials(_username: string, _password: string): Promise<boolean> {
        throw notImplementedText
    }
}
