const fetch = require('node-fetch')
const secrets = require('../../../secrets.json')
const config = require('../../../config.json')
const knownErrors = require('../knownErrors')
const mongo = require('../../mongo/connect')

const lookup = async (discordid, serverId, options) => {
  const {
    lastLookup, lookupTimeout, allowUsersToLookup,
  } = await mongo.getSettings(serverId).catch(((_) => { throw _ }))
  const timeUntil = Math.round(((new Date() - lastLookup) - (lookupTimeout * 1000)) / 1000)
  if (!allowUsersToLookup && options.type === 'lookup' && !options.bypass) throw new Error('You do not currently have permission to perform lookups. Please ask a moderator. Spamming this command will result in a warning')
  if (timeUntil < 0 && !options.bypass) throw new Error(`This command can be used again in \`${-timeUntil}\` second(s)`)
  mongo.setSetting(serverId, 'lastLookup', Date.now())

  const res = await fetch(`${secrets.v3rm.api.base}/${secrets.v3rm.api.lookup}?id=${discordid}`, {
    method: 'get',
    headers: { 'Content-Type': 'application/json' },
  }).catch((_) => { knownErrors.fetchingData(_); throw _ })

  const json = await res.json()
  if (json.error) throw new Error(json.message)
  const allGroups = new Set([
    parseInt(json.usergroup, 10),
    parseInt(json.displaygroup, 10),
    ...json.additionalgroups.map((_) => parseInt(_, 10)),
  ])

  const translationGroups = Object.entries(config.roleTranslations)
  const roles = []
  allGroups.forEach((group) => {
    translationGroups.some((translation) => {
      if (translation[1] === group) return roles.push(translation[0])
      return false
    })
  })
  return { username: json.username, uid: json.uid, roles }
}

module.exports = lookup
