// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js')
const knownErrors = require('../knownErrors')
const getArgs = require('../functions/general/argTranslations')
const { attemptRoleQueue } = require('../functions/api/v3rm/userSetup')
const { messageStatQueue } = require('../functions/database/stats')
const { checkWordFilters } = require('../functions/moderation')
const { checkPings } = require('../functions/moderation/pingAbuse')
const { unmuteMembers } = require('../functions/moderation/mute')
const { preventFlood } = require('../functions/moderation/preventFlood')

const assignRoles = async (message) => {
  const { giuseppeSettings: { channelWelcome } } = message.guild
  if (message.channel.name === channelWelcome) {
    if (/^i agree$/gmi.test(message.cleanContent) && !message.member.roles.cache.find((r) => r.name === 'Member')) {
      message.member.roles.add(message.guild.roles.cache.find((r) => r.name === 'Member')).catch((_) => knownErrors.userOperation(_, message.member.guild.id, 'assigning roles'))
    }
    message.delete().catch(() => {})
  }
}

const checkCmdPerms = (message, cmd) => {
  if (!cmd) return false

  const { giuseppeSettings: { channelBotCommands } } = message.guild
  const permissionLevel = cmd.permissionLevel.replace(/_BC$/, '')

  // The command is a bot-commands only command
  if (cmd.permissionLevel !== permissionLevel) {
    if (channelBotCommands !== message.channel.name) {
      message.delete().catch({})
      return false
    }
  }
  if (permissionLevel === 'UNIVERSAL') return true
  return message.member.hasPermission(cmd.permissionLevel)
}

const runCommand = (client, message) => {
  if (message.content.indexOf(client.config.prefix) !== 0) return
  const rawArgs = message.content.slice(client.config.prefix.length).trim().split(/ +/g)
  const command = rawArgs.shift().toLowerCase()
  const cmd = client.commands.get(command)
  if (!checkCmdPerms(message, cmd)) return
  const args = {
    raw: rawArgs,
    argMap: getArgs(rawArgs),
  }
  cmd.run(client, message, args)
}

const runTasks = async (client, message) => {
  await attemptRoleQueue()
  await messageStatQueue(client, message)
  await unmuteMembers(message.guild)
}

module.exports = async (client, message) => {
  if (message.author.bot
      || message.channel.type === 'dm'
      || !message.member
      || !message.channel
      || !message.guild
  ) return

  if (client.secrets.v3rm.api.enabled) assignRoles(message)
  checkWordFilters(client, message)
  checkPings(client, message)
  preventFlood(client, message)
  runCommand(client, message)
  runTasks(client, message)
}
