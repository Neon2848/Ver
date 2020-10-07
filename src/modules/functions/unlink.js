const fetch = require('node-fetch')
const secrets = require('../../../secrets.json')
const knownErrors = require('../knownErrors')

const unlink = async (discordid) => {
  const res = await fetch(`${secrets.v3rm.api.base}/${secrets.v3rm.api.unlink}?id=${discordid}`, {
    method: 'get',
    headers: { 'Content-Type': 'application/json' },
  }).catch((err) => { knownErrors.fetchingData(err); throw err })

  const json = await res.json()
  if (json.error) throw new Error(json.message)
  return json
}

module.exports = unlink
