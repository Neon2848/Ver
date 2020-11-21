const Discord = require('discord.js') // eslint-disable-line no-unused-vars
const { basicLookup } = require('../functions/general')

/**
 * @param {Discord.Client} client bot client
 */
module.exports = async (client, member) => {
  await basicLookup(member)
}
