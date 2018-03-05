package monzo

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
)

type Client struct {
	BaseURL   string
	AuthToken string
}

type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (err *APIError) Error() string {
	return fmt.Sprintf("%s: %s", err.Code, err.Message)
}

func (cl *Client) Get(path string, args map[string]string, response interface{}) error {
	req, err := requestQueryString(cl.BaseURL+path, args)
	if err != nil {
		return err
	}
	return cl.doHTTP(req, response)
}

func (cl *Client) Post(path string, args map[string]string, response interface{}) error {
	req, err := requestFormBody("POST", cl.BaseURL+path, args)
	if err != nil {
		return err
	}
	return cl.doHTTP(req, response)
}

func (cl *Client) Put(path string, args map[string]string, response interface{}) error {
	req, err := requestFormBody("PUT", cl.BaseURL+path, args)
	if err != nil {
		return err
	}
	return cl.doHTTP(req, response)
}

func (cl *Client) Delete(path string, args map[string]string, response interface{}) error {
	req, err := requestFormBody("DELETE", cl.BaseURL+path, args)
	if err != nil {
		return err
	}
	return cl.doHTTP(req, response)
}

func (cl *Client) doHTTP(req *http.Request, response interface{}) error {
	if cl.AuthToken != "" {
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %v", cl.AuthToken))
	}

	rsp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer rsp.Body.Close()

	bytes, err := ioutil.ReadAll(rsp.Body)
	if err != nil {
		return err
	}

	if rsp.StatusCode != 200 {
		apiErr := &APIError{}
		if err := json.Unmarshal(bytes, apiErr); err != nil {
			return err
		}
		return apiErr
	}

	if err := json.Unmarshal(bytes, response); err != nil {
		return err
	}
	return nil
}

func requestQueryString(uri string, args map[string]string) (*http.Request, error) {
	req, err := http.NewRequest("GET", uri, nil)
	if err != nil {
		return nil, err
	}
	if len(args) > 0 {
		query := req.URL.Query()
		for k, v := range args {
			query.Add(k, v)
		}
		req.URL.RawQuery = query.Encode()
	}
	return req, nil
}

func requestFormBody(method, uri string, args map[string]string) (*http.Request, error) {
	form := url.Values{}
	for k, v := range args {
		form.Set(k, v)
	}

	req, err := http.NewRequest(method, uri, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}

	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	return req, nil
}
