class Interpreter {
  constructor(api, options) {
    this.api = api;
    Object.assign(this, options)
  }

  async doScript(blocks) {
    let result
    for (let b of blocks) {
      result = await this.doBlock(b)
    }
    return result
  }

  doBlock(block) {
    const selector = block[0]
    const func = this['x_' + selector]
    if (!func) throw new Error('not implemented')
    return func.apply(this, block.slice(1))
  }

  async x_balance() {
    return new Promise((resolve, reject) => {
      this.api('/balance', {qs: {account_id: this.account_id}, 'expand[]': 'merchant'}, (error, response, body) => {
        if (error) return reject(error)
        resolve(body.balance)
        //resolve(`${body.balance} ${body.currency}`)
      })
    })
  }

  async x_potBalance(which) {
    return new Promise((resolve, reject) => {
      this.api('/pots', (error, response, body) => {
        if (error) return reject(error)
        const {pots} = body
        const pot = pots.find(p => p.id === which || p.name === which)
        resolve(pot.balance)
        //resolve(`${pot.balance} ${pot.currency}`)
      })
    })
  }
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
