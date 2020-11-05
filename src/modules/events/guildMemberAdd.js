const Discord = require('discord.js') // eslint-disable-line no-unused-vars
const { basicLookup } = require('../functions/general')
const { getExtraRoles } = require('../../mongo/members')

/**
 * @param {Discord.Client} client bot client
 */
module.exports = async (client, member) => {
  if (client.secrets.v3rm.api.enabled) basicLookup(member)
  else {
    const keepRoles = await getExtraRoles(member.guild.id, member.id)
    const keepRolesIds = keepRoles.map((r) => r.id)
    member.roles.add(keepRolesIds).catch(() => {})
  }
}
