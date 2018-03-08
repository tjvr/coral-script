package interpreter

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/monzo/typhon"
)

var APIBaseURL = "https://api.monzo.com"

func Init() {
	router := typhon.NewRouter()
	router.Register("POST", "/execute", handleExecute)

	svc := router.Serve().Filter(typhon.ErrorFilter)

	_, err := typhon.Listen(svc, "")
	if err != nil {
		panic(err)
	}

	signalsReceived := make(chan os.Signal, 2)
	signal.Notify(signalsReceived, os.Interrupt, syscall.SIGTERM)
	<-signalsReceived
}
