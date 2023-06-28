package scraper

// SiteStorageCredential defines the credentials used to login into a website
// These are credentials usually copied over from a browser
type SiteStorageCredential struct {
	ID        string `json:"id"`
	ScraperID string `json:"scraperId"`

	Invalid           bool                 `json:"invalid"`
	HiddenCredentials bool                 `json:"hiddenCredentials"`
	Cookies           *map[string][]string `json:"cookies"`
}

// SiteStorageCredentials is a slice of SiteStorageCredential with helper methods
type SiteStorageCredentials []SiteStorageCredential

// Empty returns true if there are no credentials (length == 0)
func (c SiteStorageCredentials) Empty() bool {
	return len(c) == 0
}

// OnlyValid returns credentials that have "invalid" set to false
func (c SiteStorageCredentials) OnlyValid() SiteStorageCredentials {
	valid := SiteStorageCredentials{}
	for _, cred := range c {
		if !cred.Invalid {
			valid = append(valid, cred)
		}
	}
	return valid
}

// OnlyInvalid returns credentials that have "invalid" set to true
func (c SiteStorageCredentials) OnlyInvalid() SiteStorageCredentials {
	invalid := SiteStorageCredentials{}
	for _, cred := range c {
		if cred.Invalid {
			invalid = append(invalid, cred)
		}
	}
	return invalid
}
