package interpreter

func Execute(t *Thread, blocks [][]interface{}) (Result, error) {
	return executeScript(t, blocks)
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
