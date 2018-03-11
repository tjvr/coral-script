package handlers

import (
	"net/http"

	"github.com/monzo/terrors"
	"github.com/monzo/typhon"
	"github.com/tjvr/go-monzo"
)

type ExecuteRequest struct {
	AccessToken    string          `json:"access_token"`
	UserID         string          `json:"user_id"`
	Script         [][]interface{} `json:"script"`
	IdempotencyKey string          `json:"idempotency_key"`
}

type ExecuteResponse struct {
	Result interface{} `json:"result"`
	Error  string      `json:"script_error"`
}

type WebHookRequest struct {
	AccessToken string                  `json:"access_token"`
	UserID      string                  `json:"user_id"`
	Event       *monzo.TransactionEvent `json:"event"`
}

type ConfigResponse struct {
	UserID             string       `json:"user_id"`
	AccountID          string       `json:"account_id"`
	AccountDescription string       `json:"account_description"`
	Pots               []*monzo.Pot `json:"pots"`
}

type Session struct {
	Cookie string `json:"cookie"`
	State  string `json:"state_string"`
	User   *User
}

type User struct {
	UserID       string                 `json:"user_id"`
	AccessToken  string                 `json:"access_token"`
	RefreshToken string                 `json:"refresh_token"`
	Scripts      [][]interface{}        `json:"scripts"`
	Variables    map[string]interface{} `json:"variables"`
}

type SaveSessionRequest struct {
	UserID       string `json:"user_id"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

func (session *Session) SetCookie(rsp typhon.Response) typhon.Response {
	http.SetCookie(rsp.Writer(), &http.Cookie{
		Name:  cookieName,
		Value: session.Cookie,
	})
	return rsp
}

func (session *Session) Client() (*monzo.Client, error) {
	if session.User == nil {
		return nil, terrors.Forbidden("user", "Not logged in", nil)
	}

	return &monzo.Client{
		BaseURL:      APIBaseURL,
		UserID:       session.User.UserID,
		AccessToken:  session.User.AccessToken,
		RefreshToken: session.User.RefreshToken,
	}, nil
}
