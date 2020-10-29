/* eslint-disable no-await-in-loop */
const Discord = require('discord.js') // eslint-disable-line no-unused-vars
const mongo = require('../../mongo/connect')
const log = require('../../mongo/log')

/**
 * @param {Discord.Client} client bot client
 */
module.exports = async (client) => {
  mongo.connect()
  // eslint-disable-next-line no-console
  console.log(`Connected. ${client.user.tag}!`)
  const servers = client.guilds.cache.array().map((g) => ({ serverId: g.id, serverName: g.name }))
  mongo.setupGuilds(servers)

  log('global', 'info', 'connected', undefined, { user: client.user.tag })
}

/* // The following temp code is just to kick pending users when the bot transfer happens.

  const v3rm = client.guilds.cache.get('571114137107562541')
  const membs = await v3rm.members.fetch()
  const pending = membs.filter((memb) => !memb.roles.cache.find((r) => r.name === 'Member')).array()
  const totalCount = pending.length - 1
  const failedCount = 0

  for (let i = 0; i < totalCount; i += 1) {
    const m = pending[i]
    const { tag } = m.user

    await m.send("Hey, because you haven't activated yet, we're kicking you from the v3rmillion server to tidy things up. You're welcome to rejoin at https://v3rmillion.net/discord").catch(() => { failedCount += 1 })
    await m.kick('Pending user kicked to cleanup server and prepare for new role system.')
      .catch(() => console.log(`kick failed on: ${tag}`))
    console.log(`Progress: ${i}/${totalCount}. Failed DMS: ${failedCount}`)
  } */
