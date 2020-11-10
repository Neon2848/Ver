const { alreadyOnDenylist } = require('../../../mongo/denyvote')
const { safeDelete, kickUser, inCacheUpsert } = require('../general')
const { muteMember } = require('./mute')
const { logRaysAToApprovals } = require('./raysApprovals')

/* TODO:
  if (message.member.hasPermission('KICK_MEMBERS')) return { deny: true, punish: false }
*/
const checkDenyList = async (sender, guildId) => {
  const checkDl = await alreadyOnDenylist({ serverId: guildId, id: sender.id })
  if (checkDl.exists && !checkDl.onSecondChance) return { deny: true, punish: true }
  return { deny: false, punish: false }
}

const punishUser = async (content, muteReason = 'Attempting to vote while denylisted', length = 600000) => {
  const { sendMember, message } = content
  const alreadyMuted = await muteMember(
    message.guild, sendMember, { muteReason, unmuteTime: Date.now() + length }, message,
  )
  if (alreadyMuted) {
    kickUser(sendMember, message, {
      dm: 'You have been kicked for abusing the vote delete system.',
      channel: null,
      log: 'Bot Abuse',
    })
  }
}

const runDenyList = async (content) => {
  const { messageReaction, sendMember, message } = content
  const { deny, punish } = await checkDenyList(sendMember, message.guild.id)
  if (punish) punishUser(content)
  if (deny) {
    if (messageReaction) messageReaction.users.remove(sendMember.id)
    return true
  }
  return false
}

const voteInitiatedEmbed = (senderId, recipientId, emoji, messageLink, config) => ({
  embed: {
    description: `<@${senderId}> has voted to delete a message sent by <@${recipientId}>.\n\nTo participate, please react with ${emoji} to _this_ message. The initial voter will need to confirm their vote.\n\n\
[Click here to view the message (this may be sensitive content).](https://discord.com/channels/${messageLink})`,
    color: 13441048,
    author: {
      name: 'Votemute Initiated',
      icon_url: config.images.v3rmLogo,
    },
    thumbnail: {
      url: config.images.raysA,
    },
  },
})

const voteCompleteEmbed = (recipientId, users, config) => ({
  embed: {
    description: `You have successfully vote deleted a message sent by <@${recipientId}>.\nThe sender has been muted for 10 minutes.\n\n\
If a moderator approves this votemute, the initial voter will receive 1 leaderboard point. Otherwise, the initial voter will be denylisted.\n\nVoters: ${users}`,
    color: 0,
    author: {
      name: 'Votemute Complete',
      icon_url: config.images.v3rmLogo,
    },
    thumbnail: { url: config.images.raysCool },
  },
})

const voteTimeoutEmbed = (user, config) => ({
  embed: {
    description: `<@${user}>, you have voted recently, and cannot vote again for 10 minutes or until your last vote succeeds.`,
    color: 13441048,
    author: {
      name: 'Vote Timeout',
      icon_url: config.images.v3rmLogo,
    },
  },
})

const preventReactSpam = (content, type) => {
  const { messageReaction, sendMember, message } = content
  const cacheSet = { member: sendMember, guild: message.guild }

  if (type === 'voteMuteStart') {
    if (!inCacheUpsert(type, cacheSet, 600) || sendMember.hasPermission('KICK_MEMBERS')) return false
    messageReaction.users.remove(sendMember)
    message.channel.send(voteTimeoutEmbed(sendMember.id, message.client.config))
      .then((nm) => nm.delete({ timeout: 3000 }))
    return true
  }
  if (!inCacheUpsert(type, cacheSet, 4)) return false
  messageReaction.users.remove(sendMember)
  sendMember.roles.remove(message.guild.giuseppe.roles.member)
  sendMember.send('Hey, you have been sent to our welcome channel for react spamming 😞. You will need to type "I agree" again, once you agree to our rules.')
  return true
}

const raysAStart = async (client, content) => {
  const { messageReaction, sendMember, message } = content
  if (sendMember.user.bot || message.raysA?.hasBeenVoted) return
  if (await runDenyList(content) || preventReactSpam(content, 'voteMuteStart')) return
  const theEmoji = messageReaction?.emoji || await message.guild.emojis.cache.find((e) => e.name === 'raysA')

  message.raysA = { hasBeenVoted: true }
  logRaysAToApprovals(message, sendMember)

  const messageLink = `${message.guild.id}/${message.channel.id}/${message.id}`
  const editable = await message.channel.send(
    voteInitiatedEmbed(sendMember.id, message.author.id, theEmoji, messageLink, client.config),
  )
  editable.react(theEmoji)
  editable.raysA = { targetMessage: message.id }
}

const userVoteBonus = (u, guild) => {
  const { giuseppe: { roles: { leaderboardLord, nitro, esoterica } } } = guild
  const m = guild.members.cache.get(u.id)
  if (m) {
    if (m.roles.cache.filter((r) => r.id === leaderboardLord).size) return 4
    if (m.roles.cache.filter((r) => r.id === esoterica || r.id === nitro || r.permissions.has('KICK_MEMBERS')).size) return 2
  }
  return 1
}

const getRealVoterCount = (reactionUsers, guild) => {
  const validUsers = reactionUsers.filter((u) => (!u.bot && !checkDenyList(u, guild.id).deny))
  const users = validUsers.map((u) => ` <@${u.id}> +${userVoteBonus(u, guild)}`)
  const count = validUsers.map((u) => userVoteBonus(u, guild)).reduce((a, b) => a + b)
  return { count, users }
}

const completeRaysAVote = async (message, targetMessage, users) => {
  message.reactions.removeAll()
  /* eslint-disable no-param-reassign */
  message.guild.giuseppe.queues.voteMuteStart = []
  message.guild.giuseppe.queues.voteMuteParticipate = []
  /* eslint-enable no-param-reassign */
  if (!targetMessage || targetMessage.deleted) return
  await targetMessage.delete()
  await muteMember(message.guild, targetMessage.member, { muteReason: 'Vote Muted' })
  await message.edit(voteCompleteEmbed(targetMessage.author.id, users, message.client.config))
}

const checkRaysAVote = async (content) => {
  const { sendMember, message } = content

  if (sendMember.user.bot
    || await runDenyList(content)
    || preventReactSpam(content, 'voteMuteParticipate')
    || !message.raysA?.targetMessage
  ) return false

  const targetMessage = await message.channel.messages.cache.get(message.raysA.targetMessage)
  if (message.raysA?.success) {
    await message.reactions.removeAll()
    return false
  }
  if (!targetMessage) {
    safeDelete(message)
    return false
  }
  return targetMessage
}

const raysAVote = async (client, content) => {
  const { messageReaction, message } = content
  const targetMessage = await checkRaysAVote(content)
  if (!targetMessage) return

  const reactionUsers = await messageReaction.users.fetch()
  const numVotes = getRealVoterCount(reactionUsers, message.guild)
  const newEmbed = message.embeds[0]

  if (numVotes.count >= 5) {
    message.raysA = { ...message.raysA, success: true }
    await completeRaysAVote(message, targetMessage, numVotes.users)
  } else {
    newEmbed.fields = [
      { name: 'Vote Points', value: `${numVotes.count}/5`, inline: true },
      { name: 'Voters', value: numVotes.users, inline: true },
    ]
    await message.edit({ embed: newEmbed })
  }
}

module.exports = { raysAStart, raysAVote }
