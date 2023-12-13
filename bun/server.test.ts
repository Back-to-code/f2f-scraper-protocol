import { expect, test } from "bun:test"
import { Server } from "./server"

test("works", () => {
	expect(typeof Server).toBe("function")
})
