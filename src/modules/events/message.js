// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js')
const { getSettings } = require('../../mongo/connect')
const knownErrors = require('../knownErrors')

/**
 * @param {Discord.Client} client bot client
 * @param {Discord.Message} message received message
 */
module.exports = async (client, message) => {
  if (message.author.bot) return
  if (message.channel.type === 'dm') return
  if (!message.member || !message.channel || !message.guild) return

  // Assign roles
  const { channelWelcome } = await getSettings(message.guild.id)
  if (message.channel.name === channelWelcome && /^i agree$/gmi.test(message.cleanContent)) {
    if (!message.member.roles.cache.find((r) => r.name === 'Member')) message.member.roles.add(message.guild.roles.cache.find((r) => r.name === 'Member')).catch((_) => knownErrors.userOperation(_, message.member.guild.id))
    message.delete()
  }

  // Commands
  if (message.content.indexOf(client.secrets.discord.prefix) !== 0) return
  const args = message.content.slice(client.secrets.discord.prefix.length).trim().split(/ +/g)
  const command = args.shift().toLowerCase()
  const cmd = client.commands.get(command)
  if (!cmd) return
  cmd.run(client, message, args)
}