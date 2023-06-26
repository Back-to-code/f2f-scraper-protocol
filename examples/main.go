package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"

	scraper "bitbucket.org/teamscript/scraper-protocol/go"
)

type handelersT struct {
	scraper.BaseHandlers
}

func (h handelersT) CheckCredentials(user scraper.LoginUser) (bool, error) {
	if user.Password == "test" {
		return true, nil
	}
	return false, nil
}

func main() {
	os.Setenv("RTCV_SERVER", "http://622f293abced696dff424f6f:3tL1yzpMaYy3pyb2yFdrxz5FJFmTQVdt@localhost:4000")

	server := scraper.Start("scraper-name-as-slug", &handelersT{}, scraper.StartOptions{
		FiberOptionsFn: func(app *fiber.App) {
			app.Get("/hello", func(c *fiber.Ctx) error {
				return c.SendString("Hello World")
			})
		},
	})

	loginUsers, err := server.GetUsers(true)
	if err != nil {
		log.Fatalln(err)
	}
	fmt.Printf("%+v\n", loginUsers)

	// Start scraping here..

	// server.SendCV(scraper.CV{
	// 	ReferenceNumber: "123456",
	// })

	time.Sleep(time.Hour * 10)
}
