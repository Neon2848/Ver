const fetch = require('node-fetch')
const secrets = require('../../../secrets.json')
const config = require('../../../config.json')
const knownErrors = require('../knownErrors')
const mongo = require('../../mongo/connect')

const lookup = (discordid, serverId, options) => new Promise((resolve, reject) => {
  mongo.getSettings(serverId).then(({ lastLookup, lookupTimeout, allowUsersToLookup }) => {
    const timeUntil = Math.round(((new Date() - lastLookup) - (lookupTimeout * 1000)) / 1000)

    if (!allowUsersToLookup && options.type === 'lookup' && !options.bypass) {
      reject(new Error('You do not currently have permission to perform lookups. Please ask a moderator. Spamming this command will result in a warning.'))
      return
    }
    if (timeUntil < 0 && !options.bypass) {
      reject(new Error(`This command can be used again in \`${-timeUntil}\` second(s)`))
      return
    }
    mongo.setSetting(serverId, 'lastLookup', Date.now())

    fetch(`${secrets.v3rm.api.base}/${secrets.v3rm.api.lookup}?id=${discordid}`, {
      method: 'get',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.error) reject(json.message)
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
        resolve({ username: json.username, uid: json.uid, roles })
      })
      .catch((err) => { knownErrors.fetchingData(err); reject(err) })
  }).catch(reject)
})

module.exports = lookup
