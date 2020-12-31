const Discord = require('discord.js') // eslint-disable-line no-unused-vars
const { logMember } = require('../functions/database/members')

const sortRoles = (a, b) => a.id - b.id
const minifyRoles = (r) => r.id

const filterSpecialRoles = (r) => {
  const {
    guild: {
      client: { config: { roleTranslations } },
      roles: { everyone: { id } },
    },
  } = r
  const transitions = Object.keys(roleTranslations)
  const prepDB = ['cute people'].includes(r.name)
  return !transitions.includes(r.name) && id !== r.id && !prepDB
}

const arrayRapidCompare = (a, b) => {
  if (a === b) return true
  if (a.length !== b.length) return false
  return a && b
}

const arraysEqual = (a, b) => {
  if (!arrayRapidCompare(a, b)) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

module.exports = (client, oldMember, newMember) => {
  const oldRoles = oldMember.roles.cache.filter(filterSpecialRoles).sort(sortRoles)
  const newRoles = newMember.roles.cache.filter(filterSpecialRoles).sort(sortRoles)
  if (arraysEqual(oldRoles.map(minifyRoles), newRoles.map(minifyRoles))) return

  logMember(newMember.guild.id, newMember, null, newRoles.map((r) => ({ id: r.id, name: r.name })))
}
