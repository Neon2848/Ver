const Discord = require('discord.js') // eslint-disable-line no-unused-vars
const { basicLookup } = require('../functions/general')

/**
 * @param {Discord.Client} client bot client
 */
module.exports = (client, member) => {
  if (client.secrets.v3rm.api.enabled) { basicLookup(member) }
}
