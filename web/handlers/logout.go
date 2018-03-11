package handlers

import (
	"context"
	"net/http"

	"github.com/monzo/typhon"
)

func handleLogout(req typhon.Request) typhon.Response {
	session, err := getSession(req)
	if err != nil {
		return typhon.Response{Error: err}
	}

	if err := deleteSession(req, session.Cookie); err != nil {
		return typhon.Response{Error: err}
	}

	// Redirect to homepage
	rsp := req.Response(nil)
	http.Redirect(rsp.Writer(), &req.Request, "/", http.StatusTemporaryRedirect)
	return session.SetCookie(rsp)
}

func deleteSession(ctx context.Context, cookie string) error {
	uri := storageHost + "/session/" + cookie
	rsp := typhon.NewRequest(ctx, "DELETE", uri, nil).Send().Response()
	return rsp.Decode(&struct{}{})
}
