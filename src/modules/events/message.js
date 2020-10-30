// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js')
const { getSettings } = require('../../mongo/connect')
const knownErrors = require('../knownErrors')
const getArgs = require('../functions/argTranslations')
const { attemptRoleQueue } = require('../functions/api/v3rm/userSetup')
const { messageStatQueue } = require('../functions/database/stats')

const assignRoles = async (message) => {
  const { channelWelcome } = await getSettings(message.guild.id)
  if (message.channel.name === channelWelcome) {
    if (/^i agree$/gmi.test(message.cleanContent) && !message.member.roles.cache.find((r) => r.name === 'Member')) {
      message.member.roles.add(message.guild.roles.cache.find((r) => r.name === 'Member')).catch((_) => knownErrors.userOperation(_, message.member.guild.id, 'assigning roles'))
    }
    message.delete().catch(() => {})
  }
}

const checkCmdPerms = (member, cmd) => {
  if (!cmd) return false
  if (cmd.permissionLevel === 'UNIVERSAL') return true
  return member.hasPermission(cmd.permissionLevel)
}

const runCommand = (client, message) => {
  if (message.content.indexOf(client.config.prefix) !== 0) return
  const rawArgs = message.content.slice(client.config.prefix.length).trim().split(/ +/g)
  const command = rawArgs.shift().toLowerCase()
  const cmd = client.commands.get(command)
  if (!checkCmdPerms(message.member, cmd)) return
  const args = {
    raw: rawArgs,
    argMap: getArgs(rawArgs),
  }
  cmd.run(client, message, args)
}

const runTasks = async (client, message) => {
  await attemptRoleQueue()
  await messageStatQueue(client, message)
}

module.exports = async (client, message) => {
  if (message.author.bot
      || message.channel.type === 'dm'
      || !message.member
      || !message.channel
      || !message.guild
  ) return

  if (client.secrets.v3rm.api.enabled) assignRoles(message)
  runCommand(client, message)
  runTasks(client, message)
}
