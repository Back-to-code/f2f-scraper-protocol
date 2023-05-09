package main

import (
	"fmt"
	"log"

	"bitbucket.org/teamscript/scraper-protocol"
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
	server := scraper.Start(&handelersT{}, scraper.StartOptions{})

	loginUsers, err := server.GetUsers(true)
	if err != nil {
		log.Fatalln(err)
	}
	fmt.Printf("%+v\n", loginUsers)

	// Start scraping here..

	server.SendCV(scraper.CV{
		ReferenceNumber: "123456",
	})
}
