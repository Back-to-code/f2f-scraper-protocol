# Build a scraper in GoLang

This library helps you to build a scraper in GoLang and is compliant with the [open api spec](./openapi.yaml).

```bash
go get -u bitbucket.org/teamscript/scraper-protocol
```

```go
package main

import (
	"fmt"
	"log"

	"bitbucket.org/teamscript/scraper-protocol"
)

type handelersT struct {
    // BaseHandlers is added here so implementation of all handlers is not required
    // BeseHandlers can be removed but will require you to implement all handlers
    // If you look at the code of BaseHandlers you can see their default implementations
	scraper.BaseHandlers
}

// CheckCredentials implements the scraper.BaseHandlers interface
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
```

## Library docs

```bash
go install golang.org/x/tools/cmd/godoc@latest
godoc
```

Now you can visit [localhost:6060/pkg/bitbucket.org/teamscript/scraper-protocol](http://localhost:6060/pkg/bitbucket.org/teamscript/scraper-protocol)

Some things i recomment you to look at:
- [Scraper and it's methods](http://localhost:6060/pkg/bitbucket.org/teamscript/scraper-protocol/#Scraper)
