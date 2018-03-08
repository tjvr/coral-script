package interpreter

import (
	"fmt"
	"strings"

	"github.com/tjvr/go-monzo"
)

type Result interface{}

type BadScript struct {
	Reason string
}

func (b BadScript) Error() string {
	return b.Reason
}

type Thread struct {
	Client         *monzo.Client
	Transaction    *monzo.Transaction
	IdempotencyKey string
	AccountID      string
	Pots           []*monzo.Pot
	Stopped        bool
}

func (t *Thread) GetAccountID() (string, error) {
	if t.AccountID != "" {
		return t.AccountID, nil
	}

	accounts, err := t.Client.Accounts("uk_retail")
	if err != nil {
		return "", err
	}

	for _, acc := range accounts {
		if acc.Closed {
			continue
		}
		t.AccountID = acc.ID
		return acc.ID, nil
	}
	return "", fmt.Errorf("no retail accounts")
}

func (t *Thread) GetPotID(name string) (string, error) {
	if name == "" {
		return "", nil
	}
	if strings.HasPrefix(name, "pot_") {
		return name, nil
	}

	// nb. this caching has no effect if the user has no pots.
	// But why would they do that?!
	if t.Pots == nil {
		var err error
		t.Pots, err = t.Client.Pots()
		if err != nil {
			return "", err
		}
	}
	for _, pot := range t.Pots {
		if pot.Name == name {
			return pot.ID, nil
		}
	}
	return "", nil
}

func executeScript(t *Thread, blocks [][]interface{}) (Result, error) {
	var result Result
	for _, block := range blocks {
		if t.Stopped {
			return nil, nil
		}

		var err error
		result, err = executeBlock(t, block)
		if err != nil {
			return nil, err
		}
	}
	return result, nil
}

func executeBlock(t *Thread, blocks []interface{}) (Result, error) {
	selector := blocks[0].(string)
	if selector == "" {
		return nil, BadScript{"block has invalid selector"}
	}

	command := table[selector]
	if command == nil {
		return nil, BadScript{"unknown command: " + selector}
	}

	return command(t, blocks[1:])
}
