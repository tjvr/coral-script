package handlers

import (
	"context"

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

	rsp, err := execute(req, body.IdempotencyKey, session.User, body.Script, nil)
	if err != nil {
		return typhon.Response{Error: err}
	}

	return session.SetCookie(req.Response(rsp))
}

func execute(
	ctx context.Context,
	idempotencyKey string,
	user *User,
	script [][]interface{},
	tx *monzo.Transaction,
) (*ExecuteResponse, error) {
	t := &interpreter.Thread{
		IdempotencyKey: idempotencyKey,
		Client: &monzo.Client{
			BaseURL:     APIBaseURL,
			AccessToken: user.AccessToken,
			UserID:      user.UserID,
		},
		Variables:   user.Variables,
		Transaction: tx,
	}

	result, executeErr := interpreter.Execute(t, script)

	if err := saveVariables(ctx, user.UserID, &SaveVariablesRequest{
		Variables: t.Variables,
	}); err != nil {
		return nil, err
	}

	if executeErr != nil {
		return &ExecuteResponse{
			Error: executeErr.Error(),
		}, nil
	}
	return &ExecuteResponse{
		Result: result,
	}, nil
}

func saveVariables(ctx context.Context, userID string, body *SaveVariablesRequest) error {
	uri := storageHost + "/user/" + userID + "/variables"
	rsp := typhon.NewRequest(ctx, "PUT", uri, body).Send().Response()
	session := &Session{}
	return rsp.Decode(session)
}
