package scraper

import (
	"errors"
	"fmt"
	"os"

	"github.com/gofiber/fiber/v2"
)

// StartOptions are the options for starting the scraper
type StartOptions struct {
	Listen        string // Default: ":3000"
	APIServer     string // If not set will try to use RTCV_SERVER env variable
	APIKeyID      string // If not set will try to use RTCV_API_KEY_ID env variable
	APIKey        string // If not set will try to use RTCV_API_KEY env variable
	APIPrivateKey string // If not set will try to use RTCV_PRIVATE_KEY env variable
}

func mightGetEnv(k string, defaultValue string) string {
	if defaultValue != "" {
		return defaultValue
	}
	return os.Getenv(k)
}

func mustGetEnv(k string, defaultValue string) string {
	v := mightGetEnv(k, defaultValue)
	if v == "" {
		fmt.Printf("$%s must be set\n", k)
		os.Exit(1)
	}
	return v
}

// Scraper contains all the state of a scraper
type Scraper struct {
	// Required
	server              string
	apiKeyID            string
	apiKey              string
	authorizationHeader string
	// Might be set
	privateKey string
}

// errorResponseT is send by the server when an error occurs
type errorResponseT struct {
	Error string `json:"error"`
}

// Start starts the scraper
func Start(handelers Handlers, ops StartOptions) *Scraper {
	server := mustGetEnv("RTCV_SERVER", ops.APIServer)
	apiKeyID := mustGetEnv("RTCV_API_KEY_ID", ops.APIKeyID)
	apiKey := mustGetEnv("RTCV_API_KEY", ops.APIKey)

	privateKey := mightGetEnv("RTCV_PRIVATE_KEY", ops.APIPrivateKey)

	scraper := &Scraper{
		server:              server,
		apiKeyID:            apiKeyID,
		apiKey:              apiKey,
		authorizationHeader: fmt.Sprintf("Basic %s:%s", apiKeyID, apiKey),
		privateKey:          privateKey,
	}

	err := scraper.Fetch("/api/v1/health", FetchOps{})
	if err != nil {
		fmt.Printf("Failed to ping RT-CV, error: %s\n", err)
		os.Exit(1)
	}

	app := fiber.New()
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(map[string]any{"status": "ok"})
	})

	app.Post("/check-credentials", func(c *fiber.Ctx) error {
		user := LoginUser{}
		err := c.BodyParser(&user)
		if err != nil {
			return c.Status(400).JSON(errorResponseT{err.Error()})
		}

		valid, err := handelers.CheckCredentials(user)
		if err != nil {
			status := 500
			if err == ErrNotImplemented {
				status = 404
			}
			return c.Status(status).JSON(errorResponseT{err.Error()})
		}

		status := 401
		if valid {
			status = 200
		}

		return c.Status(status).JSON(struct {
			Valid bool `json:"valid"`
		}{
			Valid: valid,
		})
	})

	go func(listen string) {
		if listen == "" {
			listen = ":3000"
		}
		err := app.Listen(listen)
		fmt.Printf("Failed to start server, error: %s\n", err)
		os.Exit(1)
	}(ops.Listen)

	return scraper
}

// LoginUser contains the login data for a scraped site user
type LoginUser struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// GetUsers gets the login users
func (s *Scraper) GetUsers(mustAtLeastOneUser bool) ([]LoginUser, error) {
	if s.privateKey == "" {
		return nil, fmt.Errorf("$RTCV_PRIVATE_KEY is not set")
	}

	resp := struct {
		Users []LoginUser `json:"users"`
	}{}

	err := s.Fetch("/api/v1/scraperUsers/"+s.apiKeyID, FetchOps{
		Output:  &resp,
		Headers: map[string]string{"X-RT-CV-Private-Key": s.privateKey},
	})
	if err != nil {
		return nil, err
	}
	if mustAtLeastOneUser && len(resp.Users) == 0 {
		return nil, errors.New("no users found")
	}

	return resp.Users, nil
}

// SendCvReq is a request to send a cv to the server
type SendCvReq struct {
	CV CV `json:"cv"`
}

// SendCV sends a cv to the server
func (s *Scraper) SendCV(cv CV) error {
	return s.Fetch("/api/v1/scraper/scanCV", FetchOps{Body: SendCvReq{cv}})
}

// SendCVsListReq is a request to send a cvs list to the server
type SendCVsListReq struct {
	CVs []CV `json:"cvs"`
}

// SendCVsList sends a cvs list to the server
func (s *Scraper) SendCVsList(cvs []CV) error {
	return s.Fetch("/api/v1/scraper/allCVs", FetchOps{Body: SendCVsListReq{cvs}})
}
