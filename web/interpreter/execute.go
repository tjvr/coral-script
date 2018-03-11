package interpreter

func Execute(t *Thread, blocks [][]interface{}) (Result, error) {
	return executeScript(t, blocks)
}
