const Discord = require('discord.js') // eslint-disable-line no-unused-vars
const { raysA } = require('../functions/moderation/raysA')

/**
 * @param {Discord.Client} client bot client
 * @param {Discord.MessageReaction} messageReaction message reaction
 * @param {Discord.User} user sender that triggered reaction
 */

const banPrompt = async (reaction, sender, message, desc, client) => {
  if (!sender.hasPermission('KICK_MEMBERS')) return
  if (reaction.emoji.name === '❌') { message.delete(); return }

  const banDeets = /<@([0-9]+)>[\s\S]+```Reason: (.+)```/.exec(desc)
  let banLength
  if (reaction.emoji.name === '3️⃣') banLength = 3
  else if (reaction.emoji.name === '7️⃣') banLength = 7
  else return

  await client.commands.get('ban').run(client, message, { argMap: { numbers: [banLength], users: [banDeets[1]] } }, banDeets[2])
  message.delete().catch(() => {})
}

const warnPrompt = async (reaction, sender, message, client) => {
  if (!sender.hasPermission('KICK_MEMBERS')) return
  const emb = new Discord.MessageEmbed({ ...message.embeds[0] })
  let warnReason = null
  if (reaction.emoji.name === '❌') emb.setFooter(`This message has been ignored by: ${sender.user.tag}.`)
  else if (reaction.emoji.name === '🇲') warnReason = '2M - Hate Speech and/or Derogatory Terms'
  else if (reaction.emoji.name === '🇱') warnReason = '2L - Filter Evasion'
  else return

  emb.color = 0
  await message.reactions.removeAll().catch(() => {})
  if (warnReason) {
    emb.setFooter(`This user has been warned by ${sender.user.tag}.`)
    const user = emb.fields[0].value.replace(/[^0-9]/g, '')
    await client.commands.get('warn')
      .run(message, { argMap: { users: [user] } }, warnReason)
  }
  await message.edit(emb).catch(() => {})
}

const botReactions = async (client, parts) => {
  const embedDesc = parts.message.embeds?.[0]?.description || null
  const embedFooter = parts.message.embeds?.[0]?.footer || null
  if (embedDesc && embedDesc.indexOf('React below to ban them for') > -1) {
    banPrompt(parts.messageReaction, parts.sendMember, parts.message, embedDesc, client)
  } if (embedFooter && embedFooter.text.indexOf('React below to warn for 2M, 2O, or ignore respestively') > -1) {
    warnPrompt(parts.messageReaction, parts.sendMember, parts.message, client)
  }
}

module.exports = async (client, messageReaction, sender) => {
  if (sender.bot || !messageReaction.message || !messageReaction.message.member) return
  const { message } = messageReaction
  const recipient = message.member
  const sendMember = message.guild.members.cache.get(sender.id)
  if (!sendMember) return

  if (recipient.id === client.user.id) {
    botReactions(client, { messageReaction, sendMember, message })
  } else if (!message.channel.name !== message.guild.giuseppeSettings.welcomeChannel) {
    raysA(client, { messageReaction, sendMember, message })
  }
}
