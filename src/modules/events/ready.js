const Discord = require('discord.js') // eslint-disable-line no-unused-vars
const mongo = require('../../mongo/connect')

/**
 * @param {Discord.Client} client bot client
 */
module.exports = (client) => {
  mongo.connect()
  // eslint-disable-next-line no-console
  console.log(`Connected. ${client.user.tag}!`)
  // mongo.log('global', 'info', 'connected', undefined, { user: client.user.tag })
}
