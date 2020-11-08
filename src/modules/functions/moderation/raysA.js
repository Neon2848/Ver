const { safeDelete, kickUser, inCacheUpsert } = require('../general')
const { muteMember } = require('./mute')

const logRaysAToApprovals = async () => {
  // TODO: Log the message to an approvals channel. Modularise and adapt the logger for this+
  // Write the leaderboard for approved votes.
  // Write the denylist for denied votes.
}

/* TODO: checkDenylList
  // Read from denylist in database
  if (message.member.hasPermission('KICK_MEMBERS')) return { deny: true, punish: false }
*/
const checkDenyList = (sender, message) => ({ deny: false, punish: false })

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
  const { deny, punish } = checkDenyList(sendMember, message)
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
    description: `You have successfully vote deleted a message sent by <@${recipientId}>.\nThe sender has been muted for 10 minutes.\n\n Voters: ${users}`,
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
    if (!inCacheUpsert(type, cacheSet, 600)) return false
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

  const messageLink = `${message.guild.id}/${message.channel.id}/${message.id}`
  const editable = await message.channel.send(
    voteInitiatedEmbed(sendMember.id, message.author.id, theEmoji, messageLink, client.config),
  )
  editable.react(theEmoji)
  editable.raysA = { targetMessage: message.id }
}

const getRealVoterCount = (reactionUsers) => {
  // TODO: Certain roles get more than +1.
  const users = reactionUsers.filter((u) => (!u.bot && !checkDenyList(u).deny)).map((u) => ` <@${u.id}> +1`)
  return { count: users.length, users }
}

const completeRaysAVote = async (message, targetMessage, users) => {
  message.reactions.removeAll()
  // eslint-disable-next-line no-param-reassign
  message.guild.giuseppe.queues.voteMutes = [] // TODO: Make sure this works
  // eslint-disable-next-line no-param-reassign
  message.guild.giuseppe.queues.voteMuteSpam = []
  if (!targetMessage || targetMessage.deleted) return
  logRaysAToApprovals()
  await targetMessage.delete()
  await muteMember(message.guild, targetMessage.member, { muteReason: 'Vote Muted' })
  await message.edit(voteCompleteEmbed(targetMessage.author.id, users, message.client.config))
}

const checkRaysAVote = async (content) => {
  const { sendMember, message } = content

  if (sendMember.user.bot || await runDenyList(content)) return false
  if (preventReactSpam(content, 'voteMuteParticipate')) return false
  if (!message.raysA?.targetMessage) return false
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
  const numVotes = getRealVoterCount(reactionUsers)
  const newEmbed = message.embeds[0]

  if (numVotes.count >= 2) {
    message.raysA = { ...message.raysA, success: true }
    completeRaysAVote(message, targetMessage, numVotes.users)
  } else {
    newEmbed.fields = [
      { name: 'Vote Points', value: `${numVotes.count}/2`, inline: true },
      { name: 'Voters', value: numVotes.users, inline: true },
    ]
    await message.edit({ embed: newEmbed })
  }
}

module.exports = { raysAStart, raysAVote }
