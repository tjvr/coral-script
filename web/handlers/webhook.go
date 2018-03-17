package handlers

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/labstack/gommon/log"
	"github.com/monzo/typhon"
	"github.com/tjvr/go-monzo"
)

type WebhookRequest struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

type TransactionWebhook struct {
	UserID        string `json:"user_id"`
	AccountID     string `json:"account_id"`
	TransactionID string `json:"transaction_id"`
}

func handleWebhook(req typhon.Request) typhon.Response {
	body := &WebhookRequest{}
	if err := req.Decode(body); err != nil {
		log.Errorf("Error decoding webhook: %v", err)
		return typhon.Response{Error: err}
	}

	switch body.Type {
	case "transaction.created":
		if err := transactionCreated(req, body.Data); err != nil {
			log.Errorf("Error handling transaction webhook: %v", err)
			return typhon.Response{Error: err}
		}
	default:
		log.Errorf("Unknown webhook event: %v", body.Type)
	}

	return req.Response(struct{}{})
}

func transactionCreated(ctx context.Context, body json.RawMessage) error {
	payload := &TransactionWebhook{}
	if err := json.Unmarshal(body, payload); err != nil {
		return err
	}

	switch {
	case payload.UserID == "":
		return fmt.Errorf("Missing user_id")
	case payload.AccountID == "":
		return fmt.Errorf("Missing account_id")
	}

	user, err := readUser(ctx, payload.UserID)
	if err != nil {
		log.Errorf("Error reading user %s: %v", payload.UserID, err)
		return err
	}

	// Check account is uk_retail
	cl := user.Client()
	accounts, err := cl.Accounts("uk_retail")
	if err != nil {
		// we might have an auth fail here
		log.Errorf("Error reading accounts: %v", err)
		return err
	}
	acc := accountByID(accounts, payload.AccountID)
	if acc == nil {
		log.Infof("Ignoring transaction for %s", payload.AccountID)
		return nil
	}

	transactions, err := cl.Transactions(payload.AccountID, false)
	if err != nil {
		log.Errorf("Error listing transactions: %v", err)
		return err
	}
	if len(transactions) == 0 {
		return fmt.Errorf("No transactions")
	}

	lastTx := transactions[len(transactions)-1]
	tx, err := cl.Transaction(lastTx.ID)
	if err != nil {
		log.Errorf("Error getting last transaction: %v", err)
		return err
	}

	return executeScripts(ctx, user, tx)
}

func executeScripts(
	ctx context.Context,
	user *User,
	tx *monzo.Transaction,
) error {
	log.Infof("Handling %s", tx.ID)

	trigger := ""
	switch {
	case tx.Amount < 0:
		trigger = "whenTxDebit"
	case tx.Amount > 0:
		trigger = "whenTxCredit"
	default:
		return nil
	}

	switch tx.Scheme {
	case "uk_retail_pot":
		return nil
	}

	for i, script := range user.Scripts {
		idempotencyKey := fmt.Sprintf("%s:%d", tx.ID, i)

		blocks := blocksFromScript(script)
		firstBlock := blocks[0]
		selector := firstBlock[0].(string)
		if selector != trigger {
			continue
		}
		log.Infof("Executing %s for %s", selector, tx.ID)

		result, err := execute(ctx, idempotencyKey, user, blocks, tx)
		if err != nil {
			return err
		}
		if result.Error != "" {
			log.Errorf("Script error: %v", result.Error)
		}
	}
	return nil
}

func blocksFromScript(script []interface{}) [][]interface{} {
	blocks := script[2].([]interface{})
	out := make([][]interface{}, len(blocks))
	for i, block := range blocks {
		out[i] = block.([]interface{})
	}
	return out
}

func readUser(ctx context.Context, userID string) (*User, error) {
	uri := storageHost + "/user/" + userID
	rsp := typhon.NewRequest(ctx, "GET", uri, nil).Send().Response()
	user := &User{}
	if err := rsp.Decode(user); err != nil {
		return nil, err
	}
	return user, nil
}

func accountByID(accounts []*monzo.Account, accountID string) *monzo.Account {
	for _, acc := range accounts {
		if acc.ID == accountID {
			return acc
		}
	}
	return nil
}
