package handlers

import (
	"strings"

	"github.com/monzo/terrors"
	"github.com/monzo/typhon"
	monzo "github.com/tjvr/go-monzo"
)

func handleConfig(req typhon.Request) typhon.Response {
	session, err := getSession(req)
	if err != nil {
		return typhon.Response{Error: err}
	}

	cl, err := session.Client()
	if err != nil {
		return typhon.Response{Error: err}
	}

	accounts, err := cl.Accounts("uk_retail")
	if err != nil {
		// TODO go-monzo should use terrors / Typhon.
		merr, ok := err.(*monzo.APIError)
		if ok && strings.HasPrefix(merr.Code, "unauthorized.bad_access_token") {
			return typhon.Response{Error: terrors.Forbidden("user", "Access token expired", nil)}
		}
		return typhon.Response{Error: err}
	}
	if len(accounts) == 0 {
		return typhon.Response{Error: terrors.PreconditionFailed("no_retail_account", "No current account", nil)}
	}
	retailAcc := accounts[0]

	pots, err := cl.Pots()
	if err != nil {
		return typhon.Response{Error: err}
	}

	return req.Response(&ConfigResponse{
		UserID:             cl.UserID,
		AccountID:          retailAcc.ID,
		AccountDescription: retailAcc.Description,
		Pots:               pots,
		Variables:          session.User.Variables,
		Scripts:            session.User.Scripts,
	})
}
