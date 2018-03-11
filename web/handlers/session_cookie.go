package handlers

import (
	"fmt"
	"math/rand"
	"os"
	"time"

	"github.com/monzo/typhon"
)

var cookieName = "session"
var storageHost string

func init() {
	rand.Seed(time.Now().UnixNano())

	storageHost = os.Getenv("CORAL_STORAGE_HOST")
	if storageHost == "" {
		panic(fmt.Errorf("CORAL_STORAGE_HOST not set"))
	}
}

func getSession(req typhon.Request) (*Session, error) {
	session := &Session{
		Cookie: getSessionCookie(req),
	}

	uri := storageHost + "/session/" + session.Cookie
	rsp := typhon.NewRequest(req, "GET", uri, nil).Send().Response()
	if err := rsp.Decode(session); err != nil {
		return nil, err
	}
	return session, nil
}

func getSessionCookie(req typhon.Request) string {
	for _, cookie := range req.Cookies() {
		if cookie.Name == cookieName && cookie.Value != "" {
			return cookie.Value
		}
	}
	return randomString(32)
}

var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func randomString(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}
