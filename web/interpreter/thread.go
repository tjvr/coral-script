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
	Variables      map[string]interface{}
}

func (t *Thread) GetTransaction() (*monzo.Transaction, error) {
	if t.Transaction != nil {
		return t.Transaction, nil
	}

	accountID, err := t.GetAccountID()
	if err != nil {
		return nil, err
	}

	// Get last transaction
	transactions, err := t.Client.Transactions(accountID, false)
	if err != nil {
		return nil, err
	}
	// nb. caching will fail if you have no transactions. This is okay
	lastTx := lastNonPotTransaction(transactions)
	if lastTx == nil {
		return nil, fmt.Errorf("no transactions yet")
	}

	// Fetch merchant data
	tx, err := t.Client.Transaction(lastTx.ID)
	if err != nil {
		return nil, err
	}
	t.Transaction = tx
	return tx, nil
}

func lastNonPotTransaction(transactions []*monzo.Transaction) *monzo.Transaction {
	for i := len(transactions) - 1; i >= 0; i-- {
		tx := transactions[i]
		if tx.Scheme == "uk_retail_pot" {
			continue
		}
		return tx
	}
	return nil
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
	return "", fmt.Errorf("pot not found: " + name)
}
