const fetch = require('node-fetch')
const secrets = require('../../../../secrets.json')
const knownErrors = require('../../knownErrors')

module.exports = async (call, queryParam) => {
  const res = await fetch(`${secrets.v3rm.api.base}/${secrets.v3rm.api[call]}/${queryParam}`, {
    method: 'get',
    headers: { 'Content-Type': 'application/json' },
  }).catch((err) => { knownErrors.fetchingData(err); throw err })
  const json = await res.json()
  if (json.error) throw new Error(json.message)
  return json
}
