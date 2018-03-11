package handlers

import (
	"context"
	"net/http"

	"github.com/monzo/terrors"
	"github.com/monzo/typhon"
)

func handleCallback(req typhon.Request) typhon.Response {
	session, err := getSession(req)
	if err != nil {
		return typhon.Response{Error: err}
	}

	state := req.URL.Query().Get("state")
	if state != session.State {
		return typhon.Response{Error: terrors.Unauthorized("state", "State param does not match", nil)}
	}

	authorizationCode := req.URL.Query().Get("code")
	cl, err := auth.Authorize(authorizationCode)
	if err != nil {
		return typhon.Response{Error: err}
	}

	// Store session
	if err := saveSession(req, session.Cookie, &SaveSessionRequest{
		UserID:       cl.UserID,
		AccessToken:  cl.AccessToken,
		RefreshToken: cl.RefreshToken,
	}); err != nil {
		return typhon.Response{Error: err}
	}

	// Redirect to homepage
	rsp := req.Response(nil)
	http.Redirect(rsp.Writer(), &req.Request, "/", http.StatusTemporaryRedirect)
	return session.SetCookie(rsp)
}

func saveSession(ctx context.Context, cookie string, body *SaveSessionRequest) error {
	uri := storageHost + "/session/" + cookie
	rsp := typhon.NewRequest(ctx, "POST", uri, body).Send().Response()
	session := &Session{}
	return rsp.Decode(session)
}
