class Interpreter {
  constructor(api, options) {
    this._api = api;
    Object.assign(this, options)
  }

  api(...args) {
    return new Promise((resolve, reject) => {
      this._api(...args, (error, response, body) => {
        if (error) return reject(error)
        // TODO check response status
        resolve(body)
      })
    })
  }

  async doScript(blocks) {
    let result
    for (let b of blocks) {
      result = await this.doBlock(b)
    }
    return result
  }

  async narg(block) {
    if (Array.isArray(block)) return await this.doBlock(block)
    return +block;
  }

  doBlock(block) {
    const selector = block[0]
    const args = block.slice(1)

    const func = this.table[selector]
    if (func) {
      return func.apply(this, args)
    }

    throw new Error('not implemented')
  }
}

function infixN(f) {
  return async function(a, b) {
    a = await this.narg(a)
    b = await this.narg(b)
    return f(a, b)
  }
}

Interpreter.prototype.table = {
  balance: async function() {
    const body = await this.api('/balance', {qs: {account_id: this.account_id}})
    return body.balance
  },
  potBalance: async function(which) {
    const {pots} = await this.api('/pots')
    const pot = pots.find(p => p.id === which || p.name === which)
    return pot.balance
  },

  '>': infixN((a, b) => a > b),
  '<': infixN((a, b) => a < b),
  '=': infixN((a, b) => a === b),

  '+': infixN((a, b) => a + b),
  '-': infixN((a, b) => a - b),
  '*': infixN((a, b) => a * b),
  '/': infixN((a, b) => a / b),
  '%': infixN((x, m) => {
    x = x % m;
    if (x / m < 0) x += m;
    return x;
  }),
}

async function coral(api, script, options) {
  const i = new Interpreter(api, options)

  console.log(script)

  try {
    const result = await i.doScript(script)
    return {result}
  } catch (err) {
    return {error: ''+err}
  }
}

module.exports = coral
