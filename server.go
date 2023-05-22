package scraper

import (
	"errors"
	"fmt"
	"net/url"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// StartOptions are the options for starting the scraper
type StartOptions struct {
	Listen    string // If not set will try to use $SERVER_PORT or default to: ":3000"
	APIServer string // If not set will try to use $RTCV_SERVER env variable
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
}

// errorResponseT is send by the server when an error occurs
type errorResponseT struct {
	Error string `json:"error"`
}

// Start starts the scraper
func Start(handelers Handlers, ops StartOptions) *Scraper {
	server := mustGetEnv("RTCV_SERVER", ops.APIServer)
	url, err := url.Parse(server)
	if err != nil {
		fmt.Printf("Invalid RTCV_SERVER url: %s\n", err)
		os.Exit(1)
	}
	if url.User == nil {
		fmt.Println("RTCV_SERVER url must contain api credentials like: https://key_id:key@example.com")
		os.Exit(1)
	}
	apiKeyID := url.User.Username()
	apiKey, passwordSet := url.User.Password()
	if !passwordSet {
		fmt.Println("RTCV_SERVER url must contain a rt-cv api key id and key, like: https://key_id:key@example.com")
		os.Exit(1)
	}

	if apiKeyID == "" || apiKey == "" {
		fmt.Println("RTCV_SERVER url must contain valid api credentials like: https://key_id:key@example.com")
		os.Exit(1)
	}

	url.User = nil
	server = url.String()

	scraper := &Scraper{
		server:              server,
		apiKeyID:            apiKeyID,
		apiKey:              apiKey,
		authorizationHeader: fmt.Sprintf("Basic %s:%s", apiKeyID, apiKey),
	}

	fmt.Println("health checking RT-CV...")
	err = scraper.FetchWithRetries("/api/v1/health", FetchOps{})
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
		listen = mightGetEnv("SERVER_PORT", listen)
		if listen == "" {
			listen = ":3000"
		} else if !strings.Contains(listen, ":") {
			// Presume only the port was provided and not the host
			listen = ":" + listen
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
	resp := struct {
		Users []LoginUser `json:"users"`
	}{}

	err := s.Fetch("/api/v1/scraperUsers/"+s.apiKeyID, FetchOps{Output: &resp})
	if err != nil {
		return nil, err
	}
	if mustAtLeastOneUser && len(resp.Users) == 0 {
		return nil, errors.New("no users found")
	}

	notSetPasswords := 0
	for _, user := range resp.Users {
		if user.Password == "" {
			notSetPasswords++
		}
	}
	if len(resp.Users) > 0 && notSetPasswords == len(resp.Users) {
		return nil, errors.New("This key uses a unsupported and deprecated scraper user encryption method, please convert your users to the new encryption method via the RT-CV dashboard")
	}

	return resp.Users, nil
}

// SendCvReq is a request to send a cv to the server
type SendCvReq struct {
	CV CV `json:"cv"`
}

// SendCV sends a cv to the server
// A request is retried 3 times
func (s *Scraper) SendCV(cv CV) error {
	return s.FetchWithRetries("/api/v1/scraper/scanCV", FetchOps{Body: SendCvReq{cv}})
}

// SendCVsListReq is a request to send a cvs list to the server
type SendCVsListReq struct {
	CVs []CV `json:"cvs"`
}

// SendCVsList sends a cvs list to the server
func (s *Scraper) SendCVsList(cvs []CV) error {
	return s.FetchWithRetries("/api/v1/scraper/allCVs", FetchOps{Body: SendCVsListReq{cvs}})
}
