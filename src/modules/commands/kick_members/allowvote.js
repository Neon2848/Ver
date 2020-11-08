const { alreadyOnDenylist, giveSecondChance } = require('../../../mongo/denyvote')
const { safeDelete } = require('../../functions/general')

const lastReasonField = (lastReason) => [{ name: 'Last Deny Reason:', value: lastReason }]

const genVoteEmbed = (name, description, senderId, lastReason, config) => ({
  embed: {
    description: `<@${senderId}>${description}`,
    color: 13441048,
    author: {
      name,
      icon_url: config.images.v3rmLogo,
    },
    fields: lastReason ? lastReasonField(lastReason) : null,
  },
})

const embs = {
  notDenylisted: (senderId, ...args) => genVoteEmbed('Allowvote issue', ' is already allowed to votemute.', senderId, ...args),
  permListed: (senderId, ...args) => genVoteEmbed('Allowvote issue', ' is denylisted, has already been denied at least twice. Admin approval is needed to remove this denylist.', senderId, ...args),
  chanceListed: (senderId, ...args) => genVoteEmbed('Allowvote success', ', you have now been removed from the votemute denylist. Please do not abuse the system again. If you\'re not sure whether or not something should be voted for, double check with a staff member.', senderId, ...args),
  reasonListed: (senderId, ...args) => genVoteEmbed('Allowvote Info', ' is not currently allowed to votemute.', senderId, ...args),
}

const getExtraArgs = (message, args) => ({
  force: args.raw.includes('force') && message.member.hasPermission('ADMINISTRATOR'),
  reason: args.raw.includes('reason'),
})

exports.run = async (client, message, args) => {
  const user = args.argMap.users[0] || null
  if (!user) return null
  const { config } = client
  const { force, reason } = getExtraArgs(message, args)
  const {
    lastDenyReason, perm, exists, onSecondChance,
  } = await alreadyOnDenylist({ serverId: message.guild.id, id: user })

  if (perm && !force) {
    return message.channel
      .send(embs.permListed(user, lastDenyReason, config)).then((m) => safeDelete(m, 15000))
  }

  if (!exists || onSecondChance) {
    return message.channel.send(
      embs.notDenylisted(user, lastDenyReason, config),
    ).then((m) => safeDelete(m, 15000))
  }

  if (reason) return message.channel.send(embs.reasonListed(user, lastDenyReason, config))
  await giveSecondChance(message.guild.id, user)
  return message.channel.send(embs.chanceListed(user, lastDenyReason, config))
}
