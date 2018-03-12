package handlers

import (
	"context"

	"github.com/monzo/terrors"
	"github.com/monzo/typhon"
)

func handleSave(req typhon.Request) typhon.Response {
	body := &SaveRequest{}
	if err := req.Decode(body); err != nil {
		return typhon.Response{Error: err}
	}

	switch {
	case body.Scripts == nil:
		return typhon.Response{Error: terrors.BadRequest("scripts", "Missing", nil)}
	}

	session, err := getSession(req)
	if err != nil {
		return typhon.Response{Error: err}
	}

	if err := saveScripts(req, session.Cookie, &SaveScriptsRequest{
		Scripts: body.Scripts,
	}); err != nil {
		return typhon.Response{Error: err}
	}
	return req.Response(&struct{}{})
}

func saveScripts(ctx context.Context, cookie string, body *SaveScriptsRequest) error {
	uri := storageHost + "/session/" + cookie + "/scripts"
	rsp := typhon.NewRequest(ctx, "PUT", uri, body).Send().Response()
	session := &Session{}
	return rsp.Decode(session)
}
