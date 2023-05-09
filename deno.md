# Build a scraper in Deno

This library helps you to build a scraper in Deno and is compliant with the [open api spec](./openapi.yaml).

```go
import { Server, Handlers, Cv } from "../mod.ts"

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

## Library docs

```bash
go install golang.org/x/tools/cmd/godoc@latest
godoc
```

Now you can visit [localhost:6060/pkg/bitbucket.org/teamscript/scraper-protocol](http://localhost:6060/pkg/bitbucket.org/teamscript/scraper-protocol)

Some things i recomment you to look at:
- [Scraper and it's methods](http://localhost:6060/pkg/bitbucket.org/teamscript/scraper-protocol/#Scraper)
