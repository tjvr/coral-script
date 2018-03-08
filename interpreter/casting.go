package interpreter

import (
	"fmt"
	"reflect"
	"strconv"
)

func eval(t *Thread, val interface{}) (Result, error) {
	block, ok := val.([]interface{})
	if !ok {
		return val, nil
	}
	return executeBlock(t, block)

}

func intArg(t *Thread, val interface{}) (int64, error) {
	val, err := eval(t, val)
	if err != nil {
		return 0, err
	}

	switch val.(type) {
	case float64:
		return int64(val.(float64) + 0.5), nil
	case int64:
		return val.(int64), nil
	case string:
		n, err := strconv.ParseInt(val.(string), 10, 64)
		if err != nil {
			n, err := strconv.ParseFloat(val.(string), 64)
			if err != nil {
				return 0, nil
			}
			return int64(n), nil
		}
		return n, nil
	default:
		fmt.Printf("%v\n", reflect.TypeOf(val))
		return 0, nil
	}
}

func floatArg(t *Thread, val interface{}) (float64, error) {
	val, err := eval(t, val)
	if err != nil {
		return 0, err
	}

	switch val.(type) {
	case float64:
		return val.(float64), nil
	case int64:
		return float64(val.(int64)), nil
	case string:
		n, err := strconv.ParseFloat(val.(string), 64)
		if err != nil {
			return 0, nil
		}
		return n, nil
	default:
		fmt.Printf("%v\n", reflect.TypeOf(val))
		return 0, nil
	}
}

func boolArg(t *Thread, val interface{}) (bool, error) {
	val, err := eval(t, val)
	if err != nil {
		return false, err
	}

	switch val {
	case "true", true:
		return true, nil
	case "false", false:
		return false, nil
	default:
		return false, nil
	}
}

func stringArg(t *Thread, val interface{}) (string, error) {
	val, err := eval(t, val)
	if err != nil {
		return "", err
	}

	switch val.(type) {
	case string:
		return val.(string), nil
	case int64:
		return strconv.FormatInt(val.(int64), 10), nil
	case float64:
		f := val.(float64)
		if f == float64(int64(f)) {
			return strconv.FormatInt(int64(f), 10), nil
		}
		return fmt.Sprintf("%.2f", f), nil
	case bool:
		return strconv.FormatBool(val.(bool)), nil
	default:
		return "", nil
	}
}
