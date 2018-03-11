package handlers

import (
	"net/http"

	"github.com/monzo/typhon"
	"github.com/tjvr/go-monzo"
)

func handleLogin(req typhon.Request) typhon.Response {
	session, err := getSession(req)
	if err != nil {
		return typhon.Response{Error: err}
	}

	uri := auth.BeginAuthURL(&monzo.Session{State: session.State})

	rsp := req.Response(nil)
	http.Redirect(rsp.Writer(), &req.Request, uri, http.StatusTemporaryRedirect)
	return session.SetCookie(rsp)
}
