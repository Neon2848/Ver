// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js')
const getArgs = require('../functions/general/argTranslations')
const { attemptRoleQueue } = require('../functions/api/v3rm/userSetup')
const { messageStatQueue } = require('../functions/database/stats')
const { checkWordFilters } = require('../functions/moderation')
const { checkPings } = require('../functions/moderation/pingAbuse')
const { unpunishMembers } = require('../functions/moderation/mute')
const { preventFlood } = require('../functions/moderation/preventFlood')
const { safeDelete, msgIntegrityCheck, basicLookup } = require('../functions/general')
const { getV3rmId } = require('../../mongo/members')

const checkCmdPerms = (message, cmd) => {
  if (!cmd) return false

  const { guild: { ver: { channels: { botCommands } } } } = message
  const permissionLevel = cmd.permissionLevel.replace(/_BC$/, '')

  // The command is a bot-commands only command
  if (cmd.permissionLevel !== permissionLevel) {
    if (botCommands !== message.channel.id) {
      safeDelete(message, 0)
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
  attemptRoleQueue()
  messageStatQueue(client, message)
  if (message.createdTimestamp % 2 === 0) unpunishMembers(message.guild)
}

module.exports = async (client, message) => {
  if (!client.reallyReady || !msgIntegrityCheck(message)) return

  // Any user who speaks and does not have a stored v3rmId will be looked up.
  // This stores them in the database, and does their role/name assignment.
  const v3rmId = await getV3rmId(message.guild.id, message.author.id)
  if (!v3rmId) await basicLookup(message.member)

  checkWordFilters(client, message)
  checkPings(client, message)
  preventFlood(client, message)
  runCommand(client, message)
  runTasks(client, message)
}
