import { Cv, Handlers, Server } from "../mod.ts";
import "https://deno.land/std@0.190.0/dotenv/load.ts";

const handlers: Handlers = {
	checkCredentials(username, password) {
		return username == "root" && password == "toor";
	},
};

// Create a new server instance
const server = new Server(handlers, {
	// Add custom handlers
	customHandlers: [
		{
			method: "GET",
			path: "/hello",
			handler: (_: Request) => {
				return new Response("Hello World");
			},
		},
	],
});

// Start the server, this returns a promise but will not be awaited as it will basically block forever
server.startServer();

const loginUsers = await server.getUsers(true);
console.log("loginUsers", loginUsers);

// Start scraping here

const cv: Cv = {
	referenceNumber: "test-123",
};
server.sendCv(cv);

// keep the server running
while (true) {
	await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 60 * 10));
}
