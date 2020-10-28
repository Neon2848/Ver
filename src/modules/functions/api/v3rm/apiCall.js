const fetch = require('node-fetch')
const secrets = require('../../../../../secrets.json')
const knownErrors = require('../../../knownErrors')

const interceptAPIError = (error) => {
  knownErrors.fetchingData(error)
  throw new Error('Unable to connect to v3rm')
}

module.exports = async (call, queryParam) => {
  const res = await fetch(`${secrets.v3rm.api.base}/${secrets.v3rm.api[call]}/${queryParam}`, {
    method: 'get',
    headers: { 'Content-Type': 'application/json' },
  }).catch(interceptAPIError)
  const json = await res.json().catch(interceptAPIError)
  if (json.error) throw new Error(json.message)
  return json
}
