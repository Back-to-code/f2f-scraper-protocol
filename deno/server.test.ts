import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts"
import { Server } from "./server.ts"

Deno.test("url test", () => {
	assertEquals(typeof Server, "function")
})
