package interpreter

import (
	"fmt"

	"github.com/monzo/terrors"
	"github.com/monzo/typhon"

	"github.com/tjvr/go-monzo"
)

func handleExecute(req typhon.Request) typhon.Response {

	body := &ExecuteRequest{}
	fmt.Println("moo")
	if err := req.Decode(body); err != nil {
		fmt.Println("bbb")
		return typhon.Response{Error: err}
	}
	fmt.Println("aaa")

	switch {
	case body.AccessToken == "":
		return typhon.Response{Error: terrors.BadRequest("access_token", "Missing", nil)}
	case body.UserID == "":
		return typhon.Response{Error: terrors.BadRequest("user_id", "Missing", nil)}
	case body.Script == nil:
		return typhon.Response{Error: terrors.BadRequest("script", "Missing", nil)}
	}

	t := &Thread{
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

	return req.Response(&ExecuteResponse{
		Result: result,
	})
}
