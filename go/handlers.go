package scraper

import (
	"errors"

	"github.com/gofiber/fiber/v2"
)

// Handlers is the interface that must be implemented by a scraper
type Handlers interface {
	CheckCredentials(user LoginUser) (valid bool, err error)
	CV(referenceNr string) (cv CV, err error)
	CheckSiteStorageCredentials(credentials SiteStorageCredentialValue) (valid bool, err error)
}

// BaseHandlers implements Handlers can be used as base for all handlers and implemenets Handlers
// All methods return ErrNotImplemented
type BaseHandlers struct{}

// _baseHandlersCheck is used to check if the BaseHandlers implements Handlers
var _baseHandlersCheck Handlers = BaseHandlers{}

// ErrNotImplemented is returned when a handler is not implemented
// All base handlers return this error
var ErrNotImplemented = errors.New("not implemented")

func errNotImplementedResponse(c *fiber.Ctx) error {
	c.Response().Header.Add("X-Not-Implemented", "true")
	return c.Status(404).JSON(errorResponseT{ErrNotImplemented.Error()})
}

// CheckCredentials checks the credentials of a user
func (h BaseHandlers) CheckCredentials(user LoginUser) (bool, error) {
	return false, ErrNotImplemented
}

// CV returns the CV of a user
func (h BaseHandlers) CV(referenceNr string) (CV, error) {
	return CV{}, ErrNotImplemented
}

// CheckSiteStorageCredentials checks the credentials of a user
//
// The scraper check the credentials and return whether the credentials are valid
func (h BaseHandlers) CheckSiteStorageCredentials(credentials SiteStorageCredentialValue) (valid bool, err error) {
	return false, ErrNotImplemented
}
