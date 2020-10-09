// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js')
const getArgs = require('../functions/argTranslations')

/**
 * @param {Discord.Client} client bot client
 * @param {Discord.Message} message old message
 * @param {Discord.Message} newMessage new object for edited message
 */
module.exports = async (client, newMessage) => {
  if (newMessage.author.bot) return
  if (newMessage.channel.type === 'dm') return
  if (!newMessage.member || !newMessage.channel || !newMessage.guild) return

  // Commands
  if (newMessage.content.indexOf(client.secrets.discord.prefix) !== 0) return
  const rawArgs = newMessage.content.slice(client.secrets.discord.prefix.length).trim().split(/ +/g)
  const command = rawArgs.shift().toLowerCase()
  const cmd = client.commands.get(command)
  if (!cmd) return
  const args = {
    raw: rawArgs,
    argMap: getArgs(rawArgs),
  }
  cmd.run(client, newMessage, args)
}
