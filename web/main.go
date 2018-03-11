package main

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/monzo/typhon"

	"./handlers"
)

func main() {
	svc := handlers.Service().Filter(typhon.ErrorFilter)

	_, err := typhon.Listen(svc, "")
	if err != nil {
		panic(err)
	}

	signalsReceived := make(chan os.Signal, 2)
	signal.Notify(signalsReceived, os.Interrupt, syscall.SIGTERM)
	<-signalsReceived

}

type HandlerError struct {
	Message    string `json:"error"`
	StatusCode int    `json:"-"`
}

func (h HandlerError) Error() string {
	return h.Message
}
