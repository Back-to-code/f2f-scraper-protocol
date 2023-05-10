# Build a scraper in Deno

This library helps you to build a scraper in Deno and is compliant with the [open api spec](./openapi.yaml).

```go
// Replace the hash with the latest commit hash
import { Server, Handlers, Cv } from "https://bitbucket.org/teamscript/scraper-protocol/raw/b611ec2ba48618db7b65a340213da25bf7050df8/mod.ts"

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
