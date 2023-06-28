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
	SkipSlugCheck        bool   // If true will skip the slug check

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
//
// # Arguments
//
//   - `slug` is the identifying slug of the scraper, it should be a unique and descriptive name for the scraper.
//     It is used by other services such as the f2f app to identify the scraper and enable specific functionality for this scraper if necessary.
//   - `handlers` is a struct containing the handlers for the scraper. These handlers implement scraper functionality such as adding credentials.
//   - `ops` is a struct containing options for the scraper.
func Start(slug string, handlers Handlers, ops StartOptions) *Scraper {
	server := mustGetEnv("RTCV_SERVER", ops.APIServer)
	serverCredentials, url := parseAPICredentials("RTCV_SERVER", server)
	url.User = nil
	server = url.String()

	if slug == "" && !ops.SkipSlugCheck {
		fmt.Println("Error: slug is required for the scraper to be identifiable! If you are sure that you want to run the scraper without a slug, use the SkipSlugCheck option in StartOptions.")
		os.Exit(1)
	}

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

	if !ops.SkipSlugCheck {
		fmt.Println("Setting slug in rt-cv...")
		slugResponse := slugUpdateResponse{}
		slugBody := slugBody{Slug: slug}

		err = scraper.FetchWithRetries("/api/v1/scraper/setSlug", FetchOps{
			Method: "PUT",
			Body:   slugBody,
			Output: &slugResponse,
		})
		if err != nil {
			fmt.Printf("Failed to set slug, error: %s\n", err)
			os.Exit(1)
		}

		if slugResponse.Slug != slug {
			fmt.Printf("Failed to set slug. Received slug that was different from what was requested\n")
			os.Exit(1)
		}

		if slugResponse.OverwroteExisting {
			fmt.Printf("Warning: Overwrote an existing slug ('%s') while setting slug to '%s'.\n", slugResponse.OldSlug, slugResponse.Slug)
		}
	}

	alternativeAPIServer := mightGetEnv("RTCV_ALTERNATIVE_SERVER", ops.AlternativeAPIServer)
	if !ops.doNotStartServer {
		credentials := []Credentials{serverCredentials}
		if alternativeServerCredentials != nil {
			credentials = append(credentials, *alternativeServerCredentials)
		}
		go apiServer(ops.Listen, handlers, credentials, ops.FiberOptionsFn)
	}

	if !ops.noAlternativeAPIServer && alternativeAPIServer != "" {
		scraper.alternativeServer = Start(slug, &BaseHandlers{}, StartOptions{
			APIServer:              alternativeAPIServer,
			doNotStartServer:       true,
			noAlternativeAPIServer: true,

			FiberOptionsFn: ops.FiberOptionsFn,
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

// GetSiteStorageCredentials gets the site storage credentials
func (s *Scraper) GetSiteStorageCredentials() (SiteStorageCredentials, error) {
	resp := SiteStorageCredentials{}
	err := s.FetchWithRetries("/api/v1/siteStorageCredentials/scraper/"+s.apiCredentials.Username, FetchOps{
		Output: &resp,
	})

	for _, credential := range resp {
		if credential.HiddenCredentials {
			return resp, errors.New("This api is not allowed to see the contents of site storage credentials")
		}
	}

	return resp, err
}

// InvalidateSiteStorageCredential invalidates a site storage credential
// Sets Invalid = true
func (s *Scraper) InvalidateSiteStorageCredential(credential *SiteStorageCredential) error {
	var updatedCredential SiteStorageCredential
	err := s.FetchWithRetries("/api/v1/siteStorageCredentials/"+credential.ID+"/invalidate", FetchOps{
		Method: "PATCH",
		Output: &updatedCredential,
	})
	if err != nil {
		return err
	}
	*credential = updatedCredential
	return nil
}

// ValidateSiteStorageCredential re-validates a site storage credential
// Sets Invalid = false
func (s *Scraper) ValidateSiteStorageCredential(credential *SiteStorageCredential) error {
	var updatedCredential SiteStorageCredential
	err := s.FetchWithRetries("/api/v1/siteStorageCredentials/"+credential.ID+"/validate", FetchOps{
		Method: "PATCH",
		Output: &updatedCredential,
	})
	if err != nil {
		return err
	}
	*credential = updatedCredential
	return nil
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

// GetActiveProfiles returns the active profiles from RT-CV
//
// Note: This function requires that the auth key has the `information obtainer` role
func (s *Scraper) GetActiveProfiles() ([]Profile, error) {
	resp := []Profile{}

	err := s.FetchWithRetries("/api/v1/profiles/active", FetchOps{
		Output: &resp,
	})
	return resp, err
}
