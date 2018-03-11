package handlers

import (
	"github.com/monzo/typhon"
	monzo "github.com/tjvr/go-monzo"
)

func handleConfig(req typhon.Request) typhon.Response {
	/*
		session := auth.GetSession(w, req)
		if !session.IsAuthenticated() {
			renderError(w, HandlerError{"not authenticated", 401})
			return
		}

		cl := auth.EnsureAuthenticated(w, req)
		if cl == nil {
			return
		}

		accounts, err := cl.Accounts("uk_retail")
		if err != nil {
			renderError(w, err)
			return
		}
		if len(accounts) == 0 {
			renderError(w, HandlerError{"no current account", 412})
			return
		}
		retailAcc := accounts[0]

		pots, err := cl.Pots()
		if err != nil {
			renderError(w, err)
			return
		}

		renderJSON(w, map[string]interface{}{
			"user_id":             cl.UserID,
			"account_id":          retailAcc.ID,
			"account_description": retailAcc.Description,
			"pots":                pots,
		})
	*/
	return req.Response(&ConfigResponse{
		Pots: []*monzo.Pot{},
	})
}
