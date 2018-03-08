package interpreter

import (
	"github.com/tjvr/go-monzo"
)

type Command func(*Thread, []interface{}) (Result, error)

var table = map[string]Command{}

func init() {
	table = map[string]Command{
		"whenTxCredit": nop,
		"whenTxDebit":  nop,

		"balance": getBalance,
		//"potBalance": getPotBalance,
		//"potDeposit": depositIntoPot,
		//"potWithdraw": withdrawFromPot,

		"txAmount":        txGetter(func(tx *monzo.Transaction) Result { return tx.Amount }),
		"txDescription":   txGetter(func(tx *monzo.Transaction) Result { return tx.Description }),
		"txNotes":         txGetter(func(tx *monzo.Transaction) Result { return tx.Notes }),
		"txLocalCurrency": txGetter(func(tx *monzo.Transaction) Result { return tx.LocalCurrency }),
		"isTopup":         txGetter(func(tx *monzo.Transaction) Result { return tx.IsLoad }),
		"txMerchantName":  txGetter(func(tx *monzo.Transaction) Result { return tx.Merchant.Name }),
		"txMerchantEmoji": txGetter(func(tx *monzo.Transaction) Result { return tx.Merchant.Emoji }),
		//"txMerchantCountry":         txGetter(func(tx *monzo.Transaction) Result { return tx.Merchant.Address.Country }),
		//"categoryTest": checkCategory,
		//"schemeTest": checkScheme,
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
	}
}

func nop(t *Thread, args []interface{}) (Result, error) {
	return nil, nil
}

func getBalance(t *Thread, args []interface{}) (Result, error) {
	accountID, err := t.GetAccountID()
	if err != nil {
		return nil, err
	}

	rsp, err := t.Client.Balance(accountID)
	if err != nil {
		return nil, err
	}

	return rsp.Balance, nil
}

func getPotBalance(t *Thread, args []interface{}) (Result, error) {
	potName, ok := args[0].(string)
	if !ok {
		return "", BadScript{"potBalance: missing argument"}
	}
	if potName == "" {
		return "", nil
	}

	return "", nil
}

/* Operators */

func add(t *Thread, args []interface{}) (Result, error) {
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
	return a + b, nil
}

func sub(t *Thread, args []interface{}) (Result, error) {
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
	return a - b, nil
}

func mul(t *Thread, args []interface{}) (Result, error) {
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
	return a * b, nil
}

func div(t *Thread, args []interface{}) (Result, error) {
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
	return float64(a) / float64(b), nil
}

func mod(t *Thread, args []interface{}) (Result, error) {
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
	return ((a % b) + b) % b, nil
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
	n, err := intArg(t, args[0])
	if err != nil {
		return nil, err
	}
	return int64(n + 0.5), nil
}

func lt(t *Thread, args []interface{}) (Result, error) {
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
	return a < b, nil
}

func gt(t *Thread, args []interface{}) (Result, error) {
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

/* Transactions */

func txGetter(getter func(*monzo.Transaction) Result) Command {
	return func(t *Thread, args []interface{}) (Result, error) {
		if t.Transaction == nil {
			return "", nil
		}
		return getter(t.Transaction), nil
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
	return category == t.Transaction.Category, nil
}

func checkScheme(t *Thread, args []interface{}) (Result, error) {
	if len(args) != 1 {
		return "", BadScript{"missing arguments"}
	}
	scheme, err := stringArg(t, args[0])
	if err != nil {
		return nil, err
	}
	return scheme == t.Transaction.Scheme, nil
}
