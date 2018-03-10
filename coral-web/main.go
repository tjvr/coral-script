package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"

	"github.com/monzo/typhon"

	"github.com/tjvr/go-monzo"
)

type InterpreterExecuteRequest struct {
	AccessToken    string          `json:"access_token"`
	UserID         string          `json:"user_id"`
	Script         [][]interface{} `json:"script"`
	IdempotencyKey string          `json:"idempotency_key"`
}

type InterpreterExecuteResponse struct {
	Result interface{} `json:"result"`
	Error  string      `json:"script_error"`
}

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
	interpreter := os.Getenv("INTERPRETER")

	fs := http.FileServer(http.Dir("public"))
	http.Handle("/", fs)

	http.HandleFunc("/callback", func(w http.ResponseWriter, req *http.Request) {
		session := auth.Callback(w, req)
		if session == nil {
			return
		}
		http.Redirect(w, req, "/", http.StatusTemporaryRedirect)
	})

	http.HandleFunc("/login", auth.Login)

	http.HandleFunc("/logout", func(w http.ResponseWriter, req *http.Request) {
		auth.Logout(w, req)
		http.Redirect(w, req, "/", http.StatusTemporaryRedirect)
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
		if err := decoder.Decode(body); err != nil {
			renderError(w, HandlerError{"invalid body: " + err.Error(), 400})
			return
		}
		defer req.Body.Close()

		for _, s := range body.Script {
			fmt.Printf("%#v\n", s)
		}

		cl := session.Client
		if cl == nil {
			renderError(w, HandlerError{"not authenticated", 401})
			return
		}
		rawRsp := typhon.NewRequest(context.Background(), "POST", interpreter, &InterpreterExecuteRequest{
			AccessToken:    cl.AccessToken,
			UserID:         cl.UserID,
			Script:         body.Script,
			IdempotencyKey: randomString(20),
		}).Send().Response()

		rsp := &InterpreterExecuteResponse{}
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

func init() {
	rand.Seed(time.Now().UnixNano())
}

var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func randomString(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}
