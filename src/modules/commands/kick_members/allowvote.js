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

const getFields = async (client, message, args) => {
  const user = args.argMap.users[0] || null
  if (!user) return null
  const dlInfo = await alreadyOnDenylist({ serverId: message.guild.id, id: user })
  const extraArgs = getExtraArgs(message, args)
  return {
    user,
    config: client.config,
    ...dlInfo,
    ...extraArgs,
  }
}

const quickSend = async (message, sendFunction, delTime = 15000) => {
  await message.channel.send(sendFunction).then((m) => { if (delTime >= 0) safeDelete(m, 15000) })
}

const succesfulAllowvote = async (message, fields) => {
  const {
    user, reason, lastDenyReason, config,
  } = fields

  if (reason) {
    quickSend(message, embs.reasonListed(user, lastDenyReason, config), -1)
    return
  }
  await giveSecondChance(message.guild.id, user)
  quickSend(message, embs.chanceListed(user, lastDenyReason, config))
}

exports.run = async (client, message, args) => {
  const fields = await getFields(client, message, args)
  if (!fields) return
  const {
    user, perm, exists, onSecondChance, force, lastDenyReason, config,
  } = fields

  if (perm && !force) {
    quickSend(message, embs.permListed(user, lastDenyReason, config))
    return
  }

  if (!exists || onSecondChance) {
    quickSend(message, embs.notDenylisted(user, lastDenyReason, config))
    return
  }
  await succesfulAllowvote(message, fields)
}
