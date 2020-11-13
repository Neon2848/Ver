/* eslint-disable max-lines-per-function */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
const Discord = require('discord.js') // eslint-disable-line no-unused-vars
const mongo = require('../../mongo/connect')
const log = require('../../mongo/log')
const { getNextUnmuteMuteTime } = require('../../mongo/mute')
const sendRules = require('../functions/moderation/sendRules')

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
      voteMuteStart: [],
      voteMuteParticipate: [],
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

  const tempChannel = await client.guilds.cache.get('571114137107562541')
  await sendRules(tempChannel.channels.cache.get('776851134765072445'))
  await sendRules(tempChannel.channels.cache.get('571117537115373570'))

  log('global', 'info', 'connected', undefined, { user: client.user.tag })
}
