/* eslint-disable max-lines-per-function */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
const Discord = require('discord.js') // eslint-disable-line no-unused-vars
const mongo = require('../../mongo/connect')
const log = require('../../mongo/log')
const { findPartialUsers } = require('../../mongo/members')
const unlink = require('../functions/api/v3rm/unlink')

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
    settings: s.settings,
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

const oldMemberCleanup = async (guild) => {
  const user = await findPartialUsers(guild.id)
  const matching = await guild.members.fetch({ user })

  matching.forEach((match) => match.kick('There was an issue with this users connection.'))
  user.forEach((_) => unlink(_).catch(() => {}))

  return { unlinked: user, kicked: matching.map((m) => m.id) }
}

module.exports = async (client) => {
  mongo.connect()

  const servers = client.guilds.cache.array()
    .map((g) => mongo.setupOneGuild({ serverId: g.id, serverName: g.name }))
  const resolvedServers = await Promise.all(servers)
  resolvedServers.forEach(async (s) => {
    const objData = client.guilds.cache.get(s.serverId)
    objData.giuseppe = await createGiuseppeObject(s, objData)

    const clean = await oldMemberCleanup(objData)
    if (clean.unlinked.length) log(objData.id, 'info', 'user cleanup', 'removed invalid links', clean)
  })

  log('global', 'info', 'connected', undefined, { user: client.user.tag })
  client.reallyReady = true
}
