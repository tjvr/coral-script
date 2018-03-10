package interpreter

import (
	"fmt"

	"github.com/monzo/terrors"
	"github.com/monzo/typhon"

	"github.com/tjvr/go-monzo"
)

func handleExecute(req typhon.Request) typhon.Response {
	body := &ExecuteRequest{}
	if err := req.Decode(body); err != nil {
		return typhon.Response{Error: err}
	}

	switch {
	case body.AccessToken == "":
		return typhon.Response{Error: terrors.BadRequest("access_token", "Missing", nil)}
	case body.UserID == "":
		return typhon.Response{Error: terrors.BadRequest("user_id", "Missing", nil)}
	case body.Script == nil:
		return typhon.Response{Error: terrors.BadRequest("script", "Missing", nil)}
	case body.IdempotencyKey == "":
		return typhon.Response{Error: terrors.BadRequest("idempotency_key", "Missing", nil)}
	}

	t := &Thread{
		IdempotencyKey: body.IdempotencyKey,
		Client: &monzo.Client{
			BaseURL:     APIBaseURL,
			AccessToken: body.AccessToken,
			UserID:      body.UserID,
		},
	}

	result, err := executeScript(t, body.Script)
	if err != nil {
		return req.Response(&ExecuteResponse{
			Error: err.Error(),
		})
	}

	fmt.Printf("%v\n", result)
	return req.Response(&ExecuteResponse{
		Result: result,
	})
}
