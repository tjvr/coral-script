package main

import (
	"context"
	"encoding/json"
	"fmt"
	"html"
	"log"
	"net/http"
	"os"

	"github.com/monzo/typhon"

	"github.com/tjvr/coral-script/interpreter"
	"github.com/tjvr/go-monzo"
)

var auth *monzo.Authenticator

func init() {
	auth = monzo.NewAuthenticator(os.Getenv("CLIENT_ID"), os.Getenv("CLIENT_SECRET"), os.Getenv("CALLBACK_URI"))
}

type HandlerError struct {
	Message    string `json:"error"`
	StatusCode int    `json:"-"`
}

func (h HandlerError) Error() string {
	return h.Message
}

func main() {
	fs := http.FileServer(http.Dir("public"))
	http.Handle("/", fs)

	http.HandleFunc("/callback", func(w http.ResponseWriter, req *http.Request) {
		session := auth.Callback(w, req)
		if session == nil {
			return
		}
		http.Redirect(w, req, "/editor", http.StatusTemporaryRedirect)
	})

	http.HandleFunc("/login", auth.Login)

	http.HandleFunc("/logout", func(w http.ResponseWriter, req *http.Request) {
		auth.Logout(w, req)
		http.Redirect(w, req, "/", http.StatusTemporaryRedirect)
	})

	http.HandleFunc("/editor", func(w http.ResponseWriter, req *http.Request) {
		cl := auth.EnsureAuthenticated(w, req)
		if cl == nil {
			return
		}

		accounts, err := cl.Accounts("uk_retail")
		if err != nil {
			// TODO errors
			return
		}
		if len(accounts) == 0 {
			// TODO errors
			return
		}
		retailAcc := accounts[0]

		fmt.Fprintf(w, "Hello, %s", html.EscapeString(retailAcc.Description))

		// TODO render authenticated editor
	})

	http.HandleFunc("/config", func(w http.ResponseWriter, req *http.Request) {
		if req.Method != "GET" {
			renderError(w, HandlerError{"method not allowed", 405})
			return
		}

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
	})

	type ExecuteRequest struct {
		Script         [][]interface{}
		IdempotencyKey string
	}

	http.HandleFunc("/execute", func(w http.ResponseWriter, req *http.Request) {
		if req.Method != "POST" {
			renderError(w, HandlerError{"method not allowed", 405})
			return
		}

		session := auth.GetSession(w, req)
		if !session.IsAuthenticated() {
			renderError(w, HandlerError{"not authenticated", 401})
			return
		}

		decoder := json.NewDecoder(req.Body)
		body := &ExecuteRequest{}
		err := decoder.Decode(body)
		if err != nil {
			panic(err)
		}
		defer req.Body.Close()

		for _, s := range body.Script {
			fmt.Printf("%#v\n", s)
		}

		rawRsp := typhon.NewRequest(context.Background(), "POST", "http://localhost:1234/execute", &interpreter.ExecuteRequest{
			AccessToken: session.Client.AccessToken,
			UserID:      session.Client.UserID,
			Script:      body.Script,
		}).Send().Response()

		rsp := &interpreter.ExecuteResponse{}
		if err := rawRsp.Decode(rsp); err != nil {
			fmt.Println(err)
			renderError(w, HandlerError{"execute error", 500})
			return
		}

		renderJSON(w, rsp)
	})

	log.Fatal(http.ListenAndServe(":8080", nil))
}

func renderError(w http.ResponseWriter, herr error) {
	bytes, err := json.Marshal(herr)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error marshaling JSON: "+err.Error())
	}

	status := 500
	if h, ok := herr.(HandlerError); ok {
		status = h.StatusCode
	}

	http.Error(w, string(bytes), status)
	w.Header().Set("Content-Type", "application/json")
}

func renderJSON(w http.ResponseWriter, rsp interface{}) {
	bytes, err := json.Marshal(rsp)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error marshaling JSON: "+err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(bytes)
}
