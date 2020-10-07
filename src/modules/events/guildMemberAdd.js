const Discord = require('discord.js') // eslint-disable-line no-unused-vars
const { basicLookup } = require('../functions')

/**
 * @param {Discord.Client} client bot client
 */
module.exports = (client, member) => basicLookup(member)
