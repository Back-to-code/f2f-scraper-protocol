# Build a scraper in Bun

This library helps you to build a scraper using Bun and is compliant with the [open api spec](./openapi.yaml).

The example below expects the following shell variables: [.env.example](./.env.example)

_FIXME: fix import statements still use bun paths_

```ts
// Replace the hash with the latest commit hash
import {
	Server,
	Handlers,
	Cv,
} from "https://bitbucket.org/teamscript/scraper-protocol/raw/b611ec2ba48618db7b65a340213da25bf7050df8/mod.ts"

const handlers: Handlers = {
	checkCredentials(username, password) {
		return username == "root" && password == "toor"
	},
}

const server = new Server(handlers, {})

// Start the server, this returns a promise but will not be awaited as it will basically block forever
server.startServer()

const loginUsers = server.getUsers(true)
console.log("loginUsers", loginUsers)

// Start scraping here

const cv: Cv = {
	referenceNumber: "test-123",
}
server.sendCv(cv)
```

## Adding a custom handler

```ts
// Replace the hash with the latest commit hash
import {
	Server,
	Handlers,
	Cv,
} from "https://bitbucket.org/teamscript/scraper-protocol/raw/b611ec2ba48618db7b65a340213da25bf7050df8/mod.ts"

const handlers: Handlers = {
	checkCredentials(username, password) {
		return username == "root" && password == "toor"
	},
}

// Custom handlers can be added to the server by passing them in the constructor
const server = new Server(handlers, {
	// Add custom handlers
	customHandlers: [
		{
			method: "GET",
			path: "/hello",
			handler: (_: Request) => {
				return new Response("Hello World")
			},
		},
	],
})

// Custom handlers can also be added after the server has been created
server.addCustomHandler([
	{
		method: "GET",
		path: "/bye",
		handler: (_: Request) => {
			return new Response("Bye World")
		},
	},
])

// Start the server, this returns a promise but will not be awaited as it will basically block forever
server.startServer()

const loginUsers = server.getUsers(true)
console.log("loginUsers", loginUsers)

// Start scraping here

const cv: Cv = {
	referenceNumber: "test-123",
}
server.sendCv(cv)
```
