package scraper

import "errors"

// Handlers is the interface that must be implemented by a scraper
type Handlers interface {
	CheckCredentials(user LoginUser) (valid bool, err error)
}

// BaseHandlers implements Handlers can be used as base for all handlers and implemenets Handlers
// All methods return ErrNotImplemented
type BaseHandlers struct{}

var baseHandlersCheck Handlers = BaseHandlers{}

// ErrNotImplemented is returned when a handler is not implemented
// All base handlers return this error
var ErrNotImplemented = errors.New("Not implemented")

// CheckCredentials checks the credentials of a user
func (h BaseHandlers) CheckCredentials(user LoginUser) (bool, error) {
	return false, ErrNotImplemented
}
