const Discord = require('discord.js') // eslint-disable-line no-unused-vars
const { getV3rmId } = require('../../mongo/members')
const { safeDelete } = require('../functions/general')
const { raysAStart, raysAVote } = require('../functions/moderation/raysA')
const { ignoreRays, denyRays, approveRays } = require('../functions/moderation/raysApprovals')
const knownErrors = require('../knownErrors')

/**
 * @param {Discord.Client} client bot client
 * @param {Discord.MessageReaction} messageReaction message reaction
 * @param {Discord.User} user sender that triggered reaction
 */

const banPrompt = async (reaction, sender, message, desc, client) => {
  if (!sender.hasPermission('KICK_MEMBERS')) return
  if (reaction.emoji.name === '❌') { safeDelete(message, 0); return }

  const banDeets = /<@([0-9]+)>[\s\S]+```Reason: (.+)```/.exec(desc)
  let banLength
  if (reaction.emoji.name === '3️⃣') banLength = 3
  else if (reaction.emoji.name === '7️⃣') banLength = 7
  else return

  await client.commands.get('ban').run(client, message, { argMap: { numbers: [banLength], users: [banDeets[1]] } }, banDeets[2])
  safeDelete(message, 0)
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
      .run(null, message, { argMap: { users: [user] } }, warnReason)
  }
  await message.edit(emb).catch(() => {})
}

const botModerationReactions = async (client, parts) => {
  const embedDesc = parts.message.embeds?.[0]?.description || null
  const embedFooter = parts.message.embeds?.[0]?.footer || null
  if (embedDesc && embedDesc.indexOf('React below to ban them for') > -1) {
    banPrompt(parts.messageReaction, parts.sendMember, parts.message, embedDesc, client)
  } if (embedFooter && embedFooter.text.indexOf('React below to warn for 2M, 2O, or ignore respestively') > -1) {
    warnPrompt(parts.messageReaction, parts.sendMember, parts.message, client)
  }
}

const botReactions = async (client, parts) => {
  const { sendMember, message, messageReaction: { emoji: { name } } } = parts
  if (name === 'raysA') raysAVote(client, parts)
  if (!message.raysA?.isApproval) return
  switch (name) {
    case '👍':
      approveRays(message, sendMember)
      break
    case '👎':
      denyRays(message, sendMember)
      break
    case '❌':
      ignoreRays(message, sendMember)
      break
    default: break
  }
}

const userReactions = async (client, parts) => {
  if (parts.messageReaction.emoji.name === 'raysA') raysAStart(client, parts)
}

const isServerReaction = (guild, rId) => !!guild.emojis.cache.get(rId)

const welcomeReaction = async (partialReaction, sender) => {
  const r = await partialReaction.fetch()
  const { message: { guild, id, channel }, message: { guild: { giuseppe: { channels } } } } = r
  if (channel.id !== channels.welcome) return

  const lastValidMsg = await channel.messages.fetch()
  if (lastValidMsg.first().id !== id) return

  const s = await guild.members.cache.get(sender.id)

  // Activate the user
  const existingDetails = await getV3rmId(guild.id, s.id)
  if (!existingDetails) return
  const roleToAdd = await guild.roles.cache.find((rol) => rol.name === 'Member')
  await s.roles.add(roleToAdd).catch((_) => knownErrors.userOperation(_, guild.id, 'assigning roles'))
}

const getVars = async (client, messageReaction, sender) => {
  await welcomeReaction(messageReaction, sender)
  if (messageReaction.partial) return false

  const { message } = messageReaction
  if (sender.bot
    || !messageReaction.message
    || !messageReaction.message.member
  ) return false
  const sendMember = await message.guild.members.cache.get(sender.id)
  if (!sendMember) return false

  return {
    client,
    message,
    parts: { messageReaction, sendMember, message },
  }
}

module.exports = async (...args) => {
  const data = await getVars(...args)
  if (!data) return

  const {
    client,
    parts,
    parts: {
      message: {
        channel, member, guild, guild: { giuseppe: { channels: { welcomeChannel } } },
      }, messageReaction: { emoji: { id } },
    },
  } = data

  if (member.id === client.user.id) {
    botModerationReactions(client, parts)
    botReactions(client, parts)
    return
  }

  if (!channel.id !== welcomeChannel && isServerReaction(guild, id)) userReactions(client, parts)
}
