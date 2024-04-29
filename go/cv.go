package scraper

// ------------------------------------------------------------
// !! Most things inside this file are copied over from !!
// https://bitbucket.org/teamscript/rt-cv/src/main/models/cv.go
// ------------------------------------------------------------

import (
	"encoding/json"
	"time"
)

// JSONRFC3339Nano Encodes a time.Time to a RFC3339Nano string
type JSONRFC3339Nano time.Time

// MarshalJSON transforms a into t into a RFC3339 time string
func (t JSONRFC3339Nano) MarshalJSON() ([]byte, error) {
	return json.Marshal(time.Time(t).Format(time.RFC3339Nano))
}

// ToPtr returns a pointer to t
func (t JSONRFC3339Nano) ToPtr() *JSONRFC3339Nano {
	return &t
}

// CV contains all information that belongs to a curriculum vitae
// TODO check the json removed fields if we actually should use them
type CV struct {
	Title           *string          `json:"title,omitempty"`
	Presentation    string           `json:"presentation,omitempty"`
	ReferenceNumber string           `json:"referenceNumber,omitempty"`
	Link            *string          `json:"link,omitempty"`
	CreatedAt       *JSONRFC3339Nano `json:"createdAt,omitempty"`
	LastChanged     *JSONRFC3339Nano `json:"lastChanged,omitempty"`
	Educations      []Education      `json:"educations,omitempty"`
	WorkExperiences []WorkExperience `json:"workExperiences,omitempty"`
	PreferredJobs   []string         `json:"preferredJobs,omitempty"`
	Preferences     *Preferences     `json:"preferences,omitempty"`
	Languages       []Language       `json:"languages,omitempty"`
	Competences     []Competence     `json:"-"` // Not supported yet
	Hobbies         []Hobby          `json:"hobbies,omitempty"`
	PersonalDetails PersonalDetails  `json:"personalDetails,omitempty"`
	DriversLicenses []string         `json:"driversLicenses,omitempty"`
	Type            CVType           `json:"cvType,omitempty"`
}

// Preferences contains preferred  job preferences
type Preferences struct {
	MaxDistanceInKm *int    `json:"maxDistanceInKm,omitempty"`
	MaximalHours    *int    `json:"maximalHours,omitempty"`
	MinimalHours    *int    `json:"minimalHours,omitempty"`
	Postcode        *string `json:"postcode,omitempty"`
	WorkingHours    *int    `json:"workingHours,omitempty"`
}

// Education is something a user has followed
type Education struct {
	Is          uint8            `json:"is" description:"What kind of education is this?: 0: Unknown, 1: Education, 2: Course"`
	Name        string           `json:"name"`
	Description string           `json:"description"`
	Institute   string           `json:"institute"`
	IsCompleted *bool            `json:"isCompleted"`
	HasDiploma  *bool            `json:"hasDiploma"`
	StartDate   *JSONRFC3339Nano `json:"startDate"`
	EndDate     *JSONRFC3339Nano `json:"endDate"`
}

// WorkExperience is experience in work
type WorkExperience struct {
	Description       string           `json:"description"`
	Profession        string           `json:"profession"`
	Employer          string           `json:"employer"`
	StartDate         *JSONRFC3339Nano `json:"startDate"`
	EndDate           *JSONRFC3339Nano `json:"endDate"`
	StillEmployed     *bool            `json:"stillEmployed"`
	WeeklyHoursWorked *uint            `json:"weeklyHoursWorked"`
}

// LanguageLevel is something that i'm not sure what it is
type LanguageLevel uint

// The lanague levels available
const (
	LanguageLevelUnknown LanguageLevel = iota
	LanguageLevelReasonable
	LanguageLevelGood
	LanguageLevelExcellent
)

func (ll LanguageLevel) String() string {
	switch ll {
	case LanguageLevelReasonable:
		return "Redelijk"
	case LanguageLevelGood:
		return "Goed"
	case LanguageLevelExcellent:
		return "Uitstekend"
	default:
		return "Onbekend"
	}
}

// Language is a language a user can speak
type Language struct {
	Name         string        `json:"name"`
	LevelSpoken  LanguageLevel `json:"levelSpoken"`
	LevelWritten LanguageLevel `json:"levelWritten"`
}

// Competence is an activity a user is "good" at
type Competence struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// Hobby contains a interest or a hobby of this user
type Hobby struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// PersonalDetails contains personal info
type PersonalDetails struct {
	Name              string           `json:"name,omitempty"`
	Initials          string           `json:"initials,omitempty"`
	FirstName         string           `json:"firstName,omitempty"`
	SurNamePrefix     string           `json:"surNamePrefix,omitempty"`
	SurName           string           `json:"surName,omitempty"`
	DateOfBirth       *JSONRFC3339Nano `json:"dob,omitempty"`
	Gender            string           `json:"gender,omitempty"`
	StreetName        string           `json:"streetName,omitempty"`
	HouseNumber       string           `json:"houseNumber,omitempty"`
	HouseNumberSuffix string           `json:"houseNumberSuffix,omitempty"`
	Zip               string           `json:"zip,omitempty"`
	City              string           `json:"city,omitempty"`
	Country           string           `json:"country,omitempty"`
	PhoneNumber       string           `json:"phoneNumber,omitempty"`
	Email             string           `json:"email,omitempty"`
}

type CVType string

const (
	Lead              CVType = "lead"
	PotentialCandiate        = "potential_candiate"
)

func (ct CVType) Valid() bool {
	for _, v := range CVTypes {
		if v == ct {
			return true
		}
	}
	return false
}

func (ct CVType) Default() CVType {
	return Lead
}

var CVTypes = []CVType{
	Lead,
	PotentialCandiate,
}
