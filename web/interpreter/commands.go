package interpreter

import (
	"fmt"
	"math/rand"

	"github.com/tjvr/go-monzo"
)

type Command func(*Thread, []interface{}) (Result, error)

var table = map[string]Command{}

func init() {
	table = map[string]Command{
		"readVariable":  readVariable,
		"setVar:to:":    setVariable,
		"changeVar:by:": changeVariableBy,

		"whenTxCredit": nop,
		"whenTxDebit":  nop,

		"doIf":     doIf,
		"doIfElse": doIf,
		// "doUntil"

		"balance":     getBalance,
		"potBalance":  getPotBalance,
		"potDeposit":  depositIntoPot,
		"potWithdraw": withdrawFromPot,

		"txAmount": txGetter(func(tx *monzo.Transaction) Result {
			amount := float64(tx.Amount) / 100
			if (amount) < 0 {
				return -amount
			}
			return amount
		}),
		"txDescription":   txGetter(func(tx *monzo.Transaction) Result { return tx.Description }),
		"txNotes":         txGetter(func(tx *monzo.Transaction) Result { return tx.Notes }),
		"txLocalCurrency": txGetter(func(tx *monzo.Transaction) Result { return tx.LocalCurrency }),
		"isTopup":         txGetter(func(tx *monzo.Transaction) Result { return tx.IsLoad }),
		"txMerchantName":  txGetter(func(tx *monzo.Transaction) Result { return tx.Merchant.Name }),
		"txMerchantEmoji": txGetter(func(tx *monzo.Transaction) Result { return tx.Merchant.Emoji }),
		//"txMerchantCountry":         txGetter(func(tx *monzo.Transaction) Result { return tx.Merchant.Address.Country }),
		"categoryTest": checkCategory,
		"schemeTest":   checkScheme,
		//"txTimeAndDate": txTimeAndDate,

		"+":     add,
		"-":     sub,
		"*":     mul,
		"/":     div,
		"%":     mod,
		"round": round,
		"abs":   abs,
		"<":     lt,
		">":     gt,
		"&":     and,
		"|":     or,
		"not":   not,
		//"=":       eq,
		"concatenate:with:": strConcat,
		"letter:of:":        strIndex,
		"stringLength:":     strLength,
		"randomFrom:to:":    randomInt,
	}
}

func nop(t *Thread, args []interface{}) (Result, error) {
	return nil, nil
}

func doIf(t *Thread, args []interface{}) (Result, error) {
	if len(args) < 2 || len(args) > 3 {
		return "", BadScript{"missing argument"}
	}
	cond, err := boolArg(t, args[0])
	if err != nil {
		return nil, err
	}

	if cond {
		blocks, ok := args[1].([][]interface{}) // TODO
		if !ok {
			return "", BadScript{"not a stack"}
		}
		_, err := executeScript(t, blocks)
		return nil, err
	}

	if len(args) == 2 {
		return nil, nil
	}
	blocks, ok := args[2].([][]interface{})
	if !ok {
		return "", BadScript{"else not a stack"}
	}
	_, err = executeScript(t, blocks)
	return nil, err
}

/* Variables */

func readVariable(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 1 {
		return "", BadScript{"missing arguments"}
	}
	name, err := stringArg(t, args[0])
	if err != nil {
		return nil, err
	}
	return t.Variables[name], nil
}

func setVariable(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 2 {
		return "", BadScript{"missing arguments"}
	}
	name, err := stringArg(t, args[0])
	if err != nil {
		return nil, err
	}
	val, err := eval(t, args[1])
	if err != nil {
		return nil, err
	}
	t.Variables[name] = val
	return nil, nil
}

func changeVariableBy(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 2 {
		return "", BadScript{"missing arguments"}
	}
	name, err := stringArg(t, args[0])
	if err != nil {
		return nil, err
	}
	delta, err := floatArg(t, args[1])
	value := toFloat(t.Variables[name])
	t.Variables[name] = value + delta
	return nil, nil
}

/* Monzo */

func getBalance(t *Thread, args []interface{}) (Result, error) {
	accountID, err := t.GetAccountID()
	if err != nil {
		return nil, err
	}

	rsp, err := t.Client.Balance(accountID)
	if err != nil {
		return nil, err
	}

	return float64(rsp.Balance) / 100, nil
}

func getPotBalance(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 1 {
		return "", BadScript{"missing argument"}
	}
	name, err := stringArg(t, args[0])
	if err != nil {
		return nil, err
	}

	potID, err := t.GetPotID(name)
	if err != nil {
		return nil, err
	}
	if potID == "" {
		return "", nil
	}
	if err != nil {
		return nil, err
	}

	pot, err := t.Client.Pot(potID)
	if err != nil {
		return nil, err
	}
	return float64(pot.Balance) / 100, nil
}

func depositIntoPot(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 2 {
		return "", BadScript{"missing arguments"}
	}
	a, err := floatArg(t, args[0])
	if err != nil {
		return nil, err
	}
	name, err := stringArg(t, args[1])
	if err != nil {
		return nil, err
	}

	accountID, err := t.GetAccountID()
	if err != nil {
		return nil, err
	}

	potID, err := t.GetPotID(name)
	if err != nil {
		return nil, err
	}

	_, err = t.Client.Deposit(&monzo.DepositRequest{
		AccountID:      accountID,
		Amount:         int64(a * 100),
		IdempotencyKey: t.MakeIdempotencyKey(),
		PotID:          potID,
	})
	if err != nil {
		return "", err
	}
	fmt.Printf("Deposited %.2f into %s\n", a, potID)
	return "", nil
}

func withdrawFromPot(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 2 {
		return "", BadScript{"missing arguments"}
	}
	a, err := floatArg(t, args[0])
	if err != nil {
		return nil, err
	}
	name, err := stringArg(t, args[1])
	if err != nil {
		return nil, err
	}

	accountID, err := t.GetAccountID()
	if err != nil {
		return nil, err
	}

	potID, err := t.GetPotID(name)
	if err != nil {
		return nil, err
	}

	_, err = t.Client.Withdraw(&monzo.WithdrawRequest{
		AccountID:      accountID,
		Amount:         int64(a * 100),
		IdempotencyKey: t.IdempotencyKey,
		PotID:          potID,
	})
	if err != nil {
		return "", err
	}
	fmt.Printf("Withdrew %.2f from %s\n", a, potID)
	return "", nil
}

/* Operators */

func add(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 2 {
		return "", BadScript{"missing arguments"}
	}
	a, err := floatArg(t, args[0])
	if err != nil {
		return nil, err
	}
	b, err := floatArg(t, args[1])
	if err != nil {
		return nil, err
	}
	return a + b, nil
}

func sub(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 2 {
		return "", BadScript{"missing arguments"}
	}
	a, err := floatArg(t, args[0])
	if err != nil {
		return nil, err
	}
	b, err := floatArg(t, args[1])
	if err != nil {
		return nil, err
	}
	return a - b, nil
}

func mul(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 2 {
		return "", BadScript{"missing arguments"}
	}
	a, err := floatArg(t, args[0])
	if err != nil {
		return nil, err
	}
	b, err := floatArg(t, args[1])
	if err != nil {
		return nil, err
	}
	return a * b, nil
}

func div(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 2 {
		return "", BadScript{"missing arguments"}
	}
	a, err := floatArg(t, args[0])
	if err != nil {
		return nil, err
	}
	b, err := floatArg(t, args[1])
	if err != nil {
		return nil, err
	}
	return a / b, nil
}

func mod(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 2 {
		return "", BadScript{"missing arguments"}
	}
	a, err := floatArg(t, args[0])
	if err != nil {
		return nil, err
	}
	b, err := floatArg(t, args[1])
	if err != nil {
		return nil, err
	}
	ai := int64(a*100 + 0.5)
	bi := int64(b*100 + 0.5)
	if bi == 0 {
		return "", fmt.Errorf("divide by zero")
	}
	return float64(((ai%bi)+bi)%bi) / 100, nil
}

func round(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 1 {
		return "", BadScript{"missing arguments"}
	}
	n, err := floatArg(t, args[0])
	if err != nil {
		return nil, err
	}
	return int64(n + 0.5), nil
}

func abs(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 1 {
		return "", BadScript{"missing arguments"}
	}
	n, err := floatArg(t, args[0])
	if err != nil {
		return nil, err
	}
	if n < 0 {
		return -n, nil
	}
	return n, nil
}

func lt(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 2 {
		return "", BadScript{"missing arguments"}
	}
	a, err := floatArg(t, args[0])
	if err != nil {
		return nil, err
	}
	b, err := floatArg(t, args[1])
	if err != nil {
		return nil, err
	}
	return a < b, nil
}

func gt(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 2 {
		return "", BadScript{"missing arguments"}
	}
	a, err := floatArg(t, args[0])
	if err != nil {
		return nil, err
	}
	b, err := floatArg(t, args[1])
	if err != nil {
		return nil, err
	}
	return a > b, nil
}

func and(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 2 {
		return "", BadScript{"missing arguments"}
	}
	a, err := boolArg(t, args[0])
	if err != nil {
		return nil, err
	}
	if !a {
		return false, nil
	}
	b, err := boolArg(t, args[1])
	if err != nil {
		return nil, err
	}
	return b, nil
}

func or(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 2 {
		return "", BadScript{"missing arguments"}
	}
	a, err := boolArg(t, args[0])
	if err != nil {
		return nil, err
	}
	if a {
		return true, nil
	}
	b, err := boolArg(t, args[1])
	if err != nil {
		return nil, err
	}
	return b, nil
}

func not(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 1 {
		return "", BadScript{"missing argument"}
	}
	a, err := boolArg(t, args[0])
	if err != nil {
		return nil, err
	}
	return !a, nil
}

func eq(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 2 {
		return "", BadScript{"missing arguments"}
	}
	// TODO execute arguments
	// TODO coerce strings to intArg if necessary
	return args[0] == args[1], nil
}

func strConcat(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 2 {
		return "", BadScript{"missing arguments"}
	}
	a, err := stringArg(t, args[0])
	if err != nil {
		return nil, err
	}
	b, err := stringArg(t, args[1])
	if err != nil {
		return nil, err
	}
	return a + b, nil
}

func strIndex(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 2 {
		return "", BadScript{"missing arguments"}
	}
	s, err := stringArg(t, args[0])
	if err != nil {
		return nil, err
	}
	n, err := intArg(t, args[1])
	if err != nil {
		return nil, err
	}
	return s[n], nil
}

func strLength(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 1 {
		return "", BadScript{"missing arguments"}
	}
	s, err := stringArg(t, args[0])
	if err != nil {
		return nil, err
	}
	return len(s), nil
}

func randomInt(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 2 {
		return "", BadScript{"missing arguments"}
	}
	a, err := intArg(t, args[0])
	if err != nil {
		return nil, err
	}
	b, err := intArg(t, args[1])
	if err != nil {
		return nil, err
	}
	if a > b {
		tmp := a
		a = b
		b = tmp
	}
	return a + rand.Int63n(b-a+1), nil
}

/* Transactions */

func txGetter(getter func(*monzo.Transaction) Result) Command {
	return func(t *Thread, args []interface{}) (Result, error) {
		tx, err := t.GetTransaction()
		if err != nil {
			return nil, err
		}
		if tx == nil {
			return "", nil
		}
		return getter(tx), nil
	}
}

func checkCategory(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 1 {
		return "", BadScript{"missing arguments"}
	}
	category, err := stringArg(t, args[0])
	if err != nil {
		return nil, err
	}
	tx, err := t.GetTransaction()
	if err != nil {
		return nil, err
	}
	if tx == nil {
		return "", nil
	}
	return category == tx.Category, nil
}

func checkScheme(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 1 {
		return "", BadScript{"missing arguments"}
	}
	scheme, err := stringArg(t, args[0])
	if err != nil {
		return nil, err
	}
	tx, err := t.GetTransaction()
	if err != nil {
		return nil, err
	}
	if tx == nil {
		return "", nil
	}
	return scheme == tx.Scheme, nil
}
