# Scraper

This repo describes how a scraper should work and gives helper libaries for building a scraper

- [Open API Spec](./openapi.yaml) _(scraper should implement this and is implemented by the libaries under here)_
- [Lib spec](./lib_spec.md)

## Why is this repo public?

This makes it a lot easier to use this as a library in other project.

But keep that also in mind when adding new features

## Add lib

```sh
bun add git+https://bitbucket.org/teamscript/scraper-protocol.git#main
```

## Usable docs

The example below expects the following shell variables: [.env.example](./.env.example)

```ts
// Replace the hash with the latest commit hash
import {
	Server,
	Handlers,
	Cv,
} from "scraper-protocol"

const handlers: Handlers = {
	checkCredentials(_server, username, password) {
		return username == "root" && password == "toor"
	},
}

const server = new Server("scraper-slug", handlers, {})

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

### Adding a custom handler

```ts
// Replace the hash with the latest commit hash
import {
	Server,
	Handlers,
	Cv,
} from "scraper-protocol"

const handlers: Handlers = {
	checkCredentials(username, password) {
		return username == "root" && password == "toor"
	},
}

// Custom handlers can be added to the server by passing them in the constructor
const server = new Server("scraper-slug", handlers, {
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
