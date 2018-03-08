package interpreter

import (
	"fmt"
	"reflect"
	"strconv"
)

func coerceNum(val interface{}) int64 {
	switch val.(type) {
	case float64:
		return int64(val.(float64))
	case int64:
		return val.(int64)
	case int:
		return int64(val.(int))
	case string:
		n, err := strconv.ParseInt(val.(string), 10, 64)
		if err != nil {
			return 0
		}
		return n
	default:
		fmt.Printf("%v\n", reflect.TypeOf(val))
		return 0
	}
}

func num(t *Thread, val interface{}) (int64, error) {
	block, ok := val.([]interface{})
	if !ok {
		return coerceNum(val), nil
	}

	result, err := executeBlock(t, block)
	if err != nil {
		return 0, err
	}
	return coerceNum(result), nil
}

func coerceBool(val interface{}) bool {
	switch val {
	case "true", true:
		return true
	case "false", false:
		return false
	}
	return false
}

func boolArg(t *Thread, val interface{}) (bool, error) {
	block, ok := val.([]interface{})
	if !ok {
		return coerceBool(val), nil
	}

	result, err := executeBlock(t, block)
	if err != nil {
		return false, err
	}
	return coerceBool(result), nil
}

func coerceString(val interface{}) string {
	str, ok := val.(string)
	if !ok {
		return ""
	}
	return str
}

func stringArg(t *Thread, val interface{}) (string, error) {
	block, ok := val.([]interface{})
	if !ok {
		return coerceString(val), nil
	}

	result, err := executeBlock(t, block)
	if err != nil {
		return "", err
	}
	return coerceString(result), nil
}
