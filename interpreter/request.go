package interpreter

import (
	"github.com/tjvr/go-monzo"
)

type ExecuteRequest struct {
	AccessToken string          `json:"access_token"`
	UserID      string          `json:"user_id"`
	Script      [][]interface{} `json:"script"`
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
