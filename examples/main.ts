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
