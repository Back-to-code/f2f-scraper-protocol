package scraper

import (
	"fmt"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/basicauth"
)

// Credentials contains a username and password combo
type Credentials struct {
	Username string
	Password string
}

func (c Credentials) rtcvAuthorizationHeader() string {
	return fmt.Sprintf("Basic %s:%s", c.Username, c.Password)
}

var errUnauthorized = "401 Unauthorized, either the authorization header is missing or incorrect. Expected `Basic <base64(apiKeyId:apiKey)>` where the apiKeyId is are the same as the scraper uses to authenticat with RT-CV"

func apiServer(listen string, handlers Handlers, credentials []Credentials, fiberOpsCallback func(*fiber.App)) {
	app := fiber.New()
	app.Use(basicauth.New(basicauth.Config{
		Authorizer: func(user, pass string) bool {
			for _, c := range credentials {
				if c.Username == user && c.Password == pass {
					return true
				}
			}
			return false
		},
		Unauthorized: func(c *fiber.Ctx) error {
			return c.Status(401).JSON(errorResponseT{errUnauthorized})
		},
	}))

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(map[string]any{"status": "ok"})
	})

	app.Post("/cv", func(c *fiber.Ctx) error {
		body := struct {
			ReferenceNr string `json:"referenceNr"`
		}{}
		err := c.BodyParser(&body)
		if err != nil {
			return c.Status(400).JSON(errorResponseT{err.Error()})
		}

		cv, err := handlers.CV(body.ReferenceNr)
		if err != nil {
			status := 500
			if err == ErrNotImplemented {
				status = 404
			}
			return c.Status(status).JSON(errorResponseT{err.Error()})
		}

		response := struct {
			CV CV `json:"cv"`
		}{CV: cv}
		return c.JSON(response)
	})

	app.Post("/check-credentials", func(c *fiber.Ctx) error {
		user := LoginUser{}
		err := c.BodyParser(&user)
		if err != nil {
			return c.Status(400).JSON(errorResponseT{err.Error()})
		}

		valid, err := handlers.CheckCredentials(user)
		if err != nil {
			status := 500
			if err == ErrNotImplemented {
				status = 404
			}
			return c.Status(status).JSON(errorResponseT{err.Error()})
		}

		return c.JSON(struct {
			Valid bool `json:"valid"`
		}{
			Valid: valid,
		})
	})

	app.Post("check-site-storage-credentials", func(c *fiber.Ctx) error {
		checkSiteStorageCredential := SiteStorageCredentialValue{}
		err := c.BodyParser(&checkSiteStorageCredential)
		if err != nil {
			return c.Status(400).JSON(errorResponseT{err.Error()})
		}

		valid, err := handlers.CheckSiteStorageCredentials(checkSiteStorageCredential)
		if err != nil {
			status := 500
			if err == ErrNotImplemented {
				status = 404
			}
			return c.Status(status).JSON(errorResponseT{err.Error()})
		}

		return c.JSON(struct {
			Valid bool `json:"valid"`
		}{
			Valid: valid,
		})
	})

	if fiberOpsCallback != nil {
		fiberOpsCallback(app)
	}

	listen = mightGetEnv("SERVER_PORT", listen)
	if listen == "" {
		listen = ":2000"
	} else if !strings.Contains(listen, ":") {
		// Presume only the port was provided and not the host
		listen = ":" + listen
	}
	err := app.Listen(listen)
	fmt.Printf("Failed to start server, error: %s\n", err)
	os.Exit(1)
}
