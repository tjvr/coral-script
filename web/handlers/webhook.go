package handlers

import (
	"fmt"

	"github.com/monzo/typhon"
	monzo "github.com/tjvr/go-monzo"
)

type WebhookRequest struct {
	ClientID    string             `json:"client_id"`
	AccountID   string             `json:"account_id"`
	Type        string             `json:"type"`
	Transaction *monzo.Transaction `json:"data"`
}

func handleWebhook(req typhon.Request) typhon.Response {
	body := &WebhookRequest{}
	if err := req.Decode(body); err != nil {
		return typhon.Response{Error: err}
	}

	fmt.Printf("%#v\n", body.Transaction)

	return req.Response(struct{}{})
}
