const Discord = require('discord.js') // eslint-disable-line no-unused-vars
const { logMember } = require('../functions/database/members')

const sortRoles = (a, b) => a.id - b.id
const minifyRoles = (r) => r.id

module.exports = (client, oldMember, newMember) => {
  const oldRoles = oldMember.roles.cache.sort(sortRoles)
  const newRoles = newMember.roles.cache.sort(sortRoles)
  if (oldRoles.map(minifyRoles) === newRoles.map(minifyRoles)) return

  logMember(newMember.guild.id, newMember, null, true)
}
