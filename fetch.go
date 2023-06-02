package scraper

import (
	"bytes"
	"encoding/json"
	"io"
	"io/ioutil"
	"net/http"
	"time"
)

// FetchOps are the options for the fetch function
type FetchOps struct {
	Body    interface{}       // Marshal the json body from this data, if nil the body is not set
	Method  string            // Default: "GET" or "POST" if body is set
	Output  interface{}       // UnMarshal the json response into this
	Headers map[string]string // Optional additional headers
}

// FetchWithRetries makes a fetch request to RT-CV and retries it 3 times if it fails
func (s *Scraper) FetchWithRetries(path string, ops FetchOps) error {
	var err error
	var retries = 3
	for i := 0; i < retries+1; i++ {
		err = s.Fetch(path, ops)
		if err == nil {
			return nil
		}
		if i != retries {
			// Have a delay between retries
			time.Sleep(time.Second * 5)
		}
	}
	return err
}

// Fetch data from RT-CV
func (s *Scraper) Fetch(path string, ops FetchOps) error {
	var req *http.Request
	var err error
	if ops.Body != nil {
		var body io.Reader
		inputAsString, ok := ops.Body.(string)
		if ok {
			body = bytes.NewBuffer([]byte(inputAsString))
		} else {
			jsonInput, err := json.Marshal(ops.Body)
			if err != nil {
				return err
			}
			body = bytes.NewBuffer(jsonInput)
		}

		if ops.Method == "" {
			ops.Method = "POST"
		}

		req, err = http.NewRequest(ops.Method, s.server+path, body)
		req.Header.Set("Content-Type", "application/json")
	} else {
		if ops.Method == "" {
			ops.Method = "GET"
		}

		req, err = http.NewRequest(ops.Method, s.server+path, nil)
	}
	if err != nil {
		return err
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", s.apiCredentials.rtcvAuthorizationHeader())
	for k, v := range ops.Headers {
		req.Header.Set(k, v)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}

	defer resp.Body.Close()
	outputBytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if ops.Output == nil {
		return nil
	}
	return json.Unmarshal(outputBytes, ops.Output)
}
