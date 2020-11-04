/* eslint-disable max-lines-per-function */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
const Discord = require('discord.js') // eslint-disable-line no-unused-vars
const mongo = require('../../mongo/connect')
const log = require('../../mongo/log')
const { getNextUnmuteMuteTime } = require('../../mongo/mute')

const convertNamesCircular = (inputArray, guild, setting, type) => {
  Object.keys(inputArray).forEach((key) => {
    const newRole = guild[type].cache.find((r) => r.name === setting[type][key])
    if (!newRole) return
    inputArray[key] = newRole.id
  })
  return inputArray
}

const createGiuseppeObject = async (s, objData) => {
  const { roles, channels } = s
  return {
    settings: {
      ...s.settings,
      nextUnmute: await getNextUnmuteMuteTime(s.serverId),
    },
    roles: convertNamesCircular(roles, objData, s, 'roles'),
    channels: convertNamesCircular(channels, objData, s, 'channels'),
    queues: {
      exploit: [],
      sensitive: [],
      pingAbuse: [],
    },
  }
}

module.exports = async (client) => {
  mongo.connect()

  const servers = client.guilds.cache.array()
    .map((g) => mongo.setupOneGuild({ serverId: g.id, serverName: g.name }))
  const resolvedServers = await Promise.all(servers)
  resolvedServers.forEach(async (s) => {
    const objData = client.guilds.cache.get(s.serverId)
    objData.giuseppe = await createGiuseppeObject(s, objData)
  })
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
