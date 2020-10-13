/* eslint-disable */
const Discord = require('discord.js') // eslint-disable-line no-unused-vars

/**
 * @param {Discord.Client} client bot client
 * @param {Discord.MessageReaction} messageReaction message reaction
 * @param {Discord.User} user sender that triggered reaction
 */

const banPrompt = async (reaction, sender, message, desc, client) => {
  if(!sender.hasPermission('KICK_MEMBERS')) return null
  if(reaction.emoji.name === '❌') return message.delete()

  const banDeets = /<@([0-9]+)>[\s\S]+```Reason: (.+)```/.exec(desc)
  let banLength
  if(reaction.emoji.name === '3️⃣') banLength = 3
  else if(reaction.emoji.name === '7️⃣') banLength = 7
  else return null

  await client.commands.get('ban').run(client, message, { argMap: { numbers: [banLength], users: [banDeets[1]] } }, banDeets[2])
  message.delete().catch(() => {})

}

module.exports = async (client, messageReaction, sender) => {
  if (sender.bot || !messageReaction.message || !messageReaction.message.member) return
  const message = messageReaction.message
  const recipient = message.member
  const sendMember = message.guild.members.cache.get(sender.id)
  if (!sendMember) return

  if(recipient.id === client.user.id) {
    const embedDesc = message.embeds?.[0]?.description || null
    if (embedDesc && embedDesc.indexOf('React below to ban them for') > -1) await banPrompt(messageReaction, sendMember, message, embedDesc, client)
  }
}
