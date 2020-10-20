const Discord = require('discord.js') // eslint-disable-line no-unused-vars
const mongo = require('../../mongo/connect')
const log = require('../../mongo/log')

/**
 * @param {Discord.Client} client bot client
 */
module.exports = (client) => {
  mongo.connect()
  // eslint-disable-next-line no-console
  console.log(`Connected. ${client.user.tag}!`)

  const servers = client.guilds.cache.array().map((g) => ({ serverId: g.id, serverName: g.name }))
  mongo.setupGuilds(servers)

  log('global', 'info', 'connected', undefined, { user: client.user.tag })
}
