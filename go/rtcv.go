package scraper

type slugBody struct {
	Slug string `json:"slug"`
}

type slugUpdateResponse struct {
	Slug              string `json:"slug"`
	OverwroteExisting bool   `json:"overwroteExisting"`
	OldSlug           string `json:"oldSlug"`
}

// Profile contains all the information about a search profile
type Profile struct {
	Id              string   `json:"id"`
	Name            string   `json:"name"`
	Active          bool     `json:"active"`
	AllowedScrapers []string `json:"allowedScrapers" bson:"allowedScrapers" description:"Define a list of scraper keys that can use this profile, if value is undefined or empty all keys are allowed"`

	MustDesiredProfession bool                `json:"mustDesiredProfession" bson:"mustDesiredProfession"`
	DesiredProfessions    []ProfileProfession `json:"desiredProfessions" bson:"desiredProfessions"`

	YearsSinceWork        *int                `json:"yearsSinceWork" bson:"yearsSinceWork"`
	MustExpProfession     bool                `json:"mustExpProfession" bson:"mustExpProfession"`
	ProfessionExperienced []ProfileProfession `json:"professionExperienced" bson:"professionExperienced"`

	Employers    []ProfileEmployer `json:"employers" bson:"employers" description:"Define a list of employers that the found CV should have"`
	MustEmployer bool              `json:"mustEmployer" bson:"mustEmployer" description:"Should the found CV have at least one employer"`

	MustDriversLicense bool                    `json:"mustDriversLicense" bson:"mustDriversLicense"`
	DriversLicenses    []ProfileDriversLicense `json:"driversLicenses" bson:"driversLicenses"`

	MustEducationFinished bool               `json:"mustEducationFinished" bson:"mustEducationFinished"`
	MustEducation         bool               `json:"mustEducation" bson:"mustEducation" description:"Should a found CV at least have one education regardless of if it's complete"`
	YearsSinceEducation   *int               `json:"yearsSinceEducation" bson:"yearsSinceEducation"`
	Educations            []ProfileEducation `json:"educations" bson:"educations"`

	Zipcodes []ProfileDutchZipcode `json:"zipCodes" bson:"zipCodes"`

	// What should happen on a match
	OnMatch ProfileOnMatch `json:"onMatch" bson:"onMatch" description:"What should happen when a match is made on this profile"`

	ListsAllowed bool `json:"listsAllowed" bson:"listsAllowed"`

	// Indicates wheather to use the matcher tree or not for matching the desired professions
	// We don't call this method useMatcherTree as we might change the underlaying search algorithm in the future hence the more generic name
	UseDeepSearch bool `json:"useDeepSearch" bson:"useDeepSearch"`
}

// ProfileProfession contains information about a proffession
type ProfileProfession struct {
	Name   string `json:"name"`
	LeafID string `json:"leafId" bson:"leafId"`
}

// ProfileEmployer contains information about an employer
type ProfileEmployer struct {
	Name string `json:"name"`
}

// ProfileDriversLicense contains the drivers license name
type ProfileDriversLicense struct {
	Name string `json:"name"`
}

// ProfileEducation contains information about an education
type ProfileEducation struct {
	Name string `json:"name"`
}

// ProfileDutchZipcode is dutch zipcode range limited to the number
type ProfileDutchZipcode struct {
	From uint16 `json:"from"`
	To   uint16 `json:"to"`
}

// ProfileOnMatch defines what should happen when a profile is matched to a CV
type ProfileOnMatch struct {
	SendMail []ProfileSendEmailData `json:"sendMail" bson:"sendMail"`
}

// ProfileSendEmailData only contains an email address atm
type ProfileSendEmailData struct {
	Email string `json:"email"`
}
