const fetch = require('node-fetch')
const secrets = require('../../../secrets.json')
const config = require('../../../config.json')
const knownErrors = require('../knownErrors')

const lookup = (discordid) => new Promise((resolve, reject) => {
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

      resolve({
        username: json.username,
        uid: json.uid,
        roles,
      })
    })
    .catch((err) => {
      knownErrors.fetchingData(err)
      reject(err)
    })
})

module.exports = lookup
