package handlers

import (
	"net/http"
	"os"

	"github.com/monzo/typhon"
	"github.com/tjvr/go-monzo"
)

var APIBaseURL = "https://api.monzo.com"

var auth *monzo.Authenticator
var static http.Handler

func init() {
	auth = monzo.NewAuthenticator(os.Getenv("CLIENT_ID"), os.Getenv("CLIENT_SECRET"), os.Getenv("CALLBACK_URI"))
	static = http.FileServer(http.Dir("public"))
}

func Service() typhon.Service {
	router := typhon.NewRouter()

	router.Register("GET", "/login", handleLogin)
	router.Register("GET", "/logout", handleLogout)
	router.Register("GET", "/callback", handleCallback)

	router.Register("GET", "/config", handleConfig)
	router.Register("POST", "/execute", handleExecute)
	router.Register("POST", "/webhook", handleWebhook)

	// Abuse Typhon to serve static files
	staticPaths := []string{
		"/",
		"/lib/visual/visual.css",
		"/lib/visual/visual.js",
		"/assets/pixie.css",
		"/lib/pixie/pixie.js",
	}
	for _, path := range staticPaths {
		router.Register("GET", path, handleStatic(path))
	}

	return router.Serve()
}

func handleStatic(path string) typhon.Service {
	return func(req typhon.Request) typhon.Response {
		rsp := req.Response(nil)
		static.ServeHTTP(rsp.Writer(), &req.Request)
		return rsp
	}
}
