const Discord = require('discord.js') // eslint-disable-line no-unused-vars
const { logMember } = require('../functions/database/members')

const sortRoles = (a, b) => a.id - b.id
const minifyRoles = (r) => r.id

const filterSpecialRoles = async (r) => {
  const {
    guild: {
      client: { config: { roleTranslations } },
      roles: { everyone: { id } },
    },
  } = r
  const transitions = Object.keys(roleTranslations)
  return !transitions.includes(r.name) && id !== r.id
}

const arraysEqual = (a, b) => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (a.length !== b.length) return false

  a.forEach((v, i) => {
    if (v !== b[i]) return false
    return true
  })
  return true
}

module.exports = (client, oldMember, newMember) => {
  const oldRoles = oldMember.roles.cache.sort(sortRoles).filter(filterSpecialRoles)
  const newRoles = newMember.roles.cache.sort(sortRoles).filter(filterSpecialRoles)
  if (arraysEqual(oldRoles.map(minifyRoles), newRoles.map(minifyRoles))) return

  logMember(newMember.guild.id, newMember, null, newRoles.map((r) => ({ id: r.id, name: r.name })))
}
