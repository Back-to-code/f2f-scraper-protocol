import { Cv, Handlers, Server } from "../mod.ts"
import "https://deno.land/std@0.190.0/dotenv/load.ts"

const handlers: Handlers = {
	checkCredentials(_server, username, password) {
		return username == "root" && password == "toor"
	},
	checkSiteStorageCredentials(_server, credentials) {
		if (!credentials.cookies) return false
		for (const [name, values] of Object.entries(credentials.cookies)) {
			for (const value of values) {
				if (name == "cookie-name" && value == "cookie-value") {
					return true
				}
			}
		}
		return false
	},
}

// Create a new server instance
const server = new Server("scraper-name-as-slug", handlers, {
	// Add custom handlers
	customHandlers: [
		{
			method: "GET",
			path: "/hello",
			handler: (_server, _: Request) => {
				return new Response("Hello World")
			},
		},
	],
})

// Start the server, this returns a promise but will not be awaited as it will basically block forever
server.startServer()

const loginUsers = await server.getUsers(true)
console.log("loginUsers", loginUsers)

// Start scraping here

const cv: Cv = {
	referenceNumber: "test-123",
}
server.sendCv(cv)

// keep the server running
while (true) {
	await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 60 * 10))
}
