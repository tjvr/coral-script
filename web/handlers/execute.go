package handlers

import (
	"fmt"

	"github.com/monzo/terrors"
	"github.com/monzo/typhon"
	"github.com/tjvr/go-monzo"

	"../interpreter"
)

func handleExecute(req typhon.Request) typhon.Response {
	body := &ExecuteRequest{}
	if err := req.Decode(body); err != nil {
		return typhon.Response{Error: err}
	}

	switch {
	case body.Script == nil:
		return typhon.Response{Error: terrors.BadRequest("script", "Missing", nil)}
	}

	session, err := getSession(req)
	if err != nil {
		return typhon.Response{Error: err}
	}
	if session.User == nil {
		return typhon.Response{Error: terrors.Forbidden("no_user", "Not authenticated", nil)}
	}

	t := &interpreter.Thread{
		IdempotencyKey: body.IdempotencyKey,
		Client: &monzo.Client{
			BaseURL:     APIBaseURL,
			AccessToken: session.User.AccessToken,
			UserID:      session.User.UserID,
		},
	}

	result, err := interpreter.Execute(t, body.Script)
	if err != nil {
		return req.Response(&ExecuteResponse{
			Error: err.Error(),
		})
	}

	fmt.Printf("%v\n", result)
	return session.SetCookie(req.Response(&ExecuteResponse{
		Result: result,
	}))
}
