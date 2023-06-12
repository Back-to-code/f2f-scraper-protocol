package scraper

import (
	"errors"
	"fmt"
	"net/url"
	"os"

	"github.com/gofiber/fiber/v2"
)

// StartOptions are the options for starting the scraper
type StartOptions struct {
	// Required (If not set by env variables)
	APIServer string // If not set will try to use $RTCV_SERVER env variable
	// Optional
	Listen               string // If not set will try to use $SERVER_PORT or default to: ":3000"
	AlternativeAPIServer string // If not set will try to use $RTCV_ALTERNATIVE_SERVER env variable

	// Internal options
	noAlternativeAPIServer bool // If true will disable the alternative server, mainly used
	doNotStartServer       bool // If true will not start the scraper api endpoint

	// Fiber options
	//
	// A function that will be called with a pointer to a fiber app instance before
	// starting the server.
	//
	// This can be used to add custom routes or modify other behavior of the server.
	FiberOptionsFn func(*fiber.App)
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
	server            string
	apiCredentials    Credentials
	alternativeServer *Scraper
}

// errorResponseT is send by the server when an error occurs
type errorResponseT struct {
	Error string `json:"error"`
}

func parseAPICredentials(envName string, serverURI string) (Credentials, *url.URL) {
	url, err := url.Parse(serverURI)
	if err != nil {
		fmt.Printf("Invalid $%s url: %s\n", envName, err)
		os.Exit(1)
	}
	if url.User == nil {
		fmt.Println("$" + envName + " url must contain api credentials like: https://key_id:key@example.com")
		os.Exit(1)
	}
	apiKeyID := url.User.Username()
	apiKey, passwordSet := url.User.Password()
	if !passwordSet {
		fmt.Println("$" + envName + " url must contain a rt-cv api key id and key, like: https://key_id:key@example.com")
		os.Exit(1)
	}

	if apiKeyID == "" || apiKey == "" {
		fmt.Println("$" + envName + " url must contain valid api credentials like: https://key_id:key@example.com")
		os.Exit(1)
	}

	return Credentials{
		Username: apiKeyID,
		Password: apiKey,
	}, url
}

// Start starts the scraper
func Start(handlers Handlers, ops StartOptions) *Scraper {
	server := mustGetEnv("RTCV_SERVER", ops.APIServer)
	serverCredentials, url := parseAPICredentials("RTCV_SERVER", server)
	url.User = nil
	server = url.String()

	var alternativeServerCredentials *Credentials
	alternativeServer := mightGetEnv("RTCV_ALTERNATIVE_SERVER", ops.AlternativeAPIServer)
	if !ops.noAlternativeAPIServer && alternativeServer != "" {
		serverCredentials, _ := parseAPICredentials("RTCV_ALTERNATIVE_SERVER", alternativeServer)
		alternativeServerCredentials = &serverCredentials
	}

	scraper := &Scraper{
		server:         server,
		apiCredentials: serverCredentials,
	}

	fmt.Println("health checking RT-CV...")
	err := scraper.FetchWithRetries("/api/v1/health", FetchOps{})
	if err != nil {
		fmt.Printf("Failed to ping RT-CV, error: %s\n", err)
		os.Exit(1)
	}

	alternativeAPIServer := mightGetEnv("RTCV_ALTERNATIVE_SERVER", ops.AlternativeAPIServer)
	if !ops.doNotStartServer {
		credentials := []Credentials{serverCredentials}
		if alternativeServerCredentials != nil {
			credentials = append(credentials, *alternativeServerCredentials)
		}
		go apiServer(ops.Listen, handlers, credentials)
	}

	if !ops.noAlternativeAPIServer && alternativeAPIServer != "" {
		scraper.alternativeServer = Start(&BaseHandlers{}, StartOptions{
			APIServer:              alternativeAPIServer,
			doNotStartServer:       true,
			noAlternativeAPIServer: true,
		})
	}

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

	err := s.Fetch("/api/v1/scraperUsers/"+s.apiCredentials.Username, FetchOps{Output: &resp})
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
		return nil, errors.New("this key uses a unsupported and deprecated scraper user encryption method, please convert your users to the new encryption method via the RT-CV dashboard")
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
	err := s.FetchWithRetries("/api/v1/scraper/scanCV", FetchOps{Body: SendCvReq{cv}})
	if err != nil {
		return err
	}

	if s.alternativeServer != nil {
		err = s.alternativeServer.SendCV(cv)
		if err != nil {
			fmt.Printf("Failed to send cv to alternative server, error: %s\n", err)
		}
	}

	return nil
}

// SendCVsListReq is a request to send a cvs list to the server
type SendCVsListReq struct {
	CVs []CV `json:"cvs"`
}

// SendCVsList sends a cvs list to the server
func (s *Scraper) SendCVsList(cvs []CV) error {
	err := s.FetchWithRetries("/api/v1/scraper/allCVs", FetchOps{Body: SendCVsListReq{cvs}})
	if err != nil {
		return err
	}

	if s.alternativeServer != nil {
		err = s.alternativeServer.SendCVsList(cvs)
		if err != nil {
			fmt.Printf("Failed to send cvs list to alternative server, error: %s\n", err)
		}
	}

	return nil
}
