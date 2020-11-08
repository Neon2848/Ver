const { alreadyOnDenylist, giveSecondChance } = require('../../../mongo/denyvote')
const { safeDelete } = require('../../functions/general')

const lastReasonField = (lastReason) => [{ name: 'Last Deny Reason:', value: lastReason }]

const notDenylisted = (senderId, config, lastReason, secondChance = false) => ({
  embed: {
    description: `<@${senderId}> is already allowed to votemute.`,
    color: 13441048,
    author: {
      name: 'Allowvote Issue',
      icon_url: config.images.v3rmLogo,
    },
    fields: secondChance ? lastReasonField(lastReason) : null,
  },
})

const permListed = (senderId, config, lastReason) => ({
  embed: {
    description: `<@${senderId}> is denylisted, has already been denied at least twice. Admin approval is needed to remove this denylist.`,
    color: 13441048,
    author: {
      name: 'Allowvote Issue',
      icon_url: config.images.v3rmLogo,
    },
    fields: lastReasonField(lastReason),
  },
})

const chanceListed = (senderId, config, lastReason) => ({
  embed: {
    description: `<@${senderId}>, you have now been removed from the votemute denylist. Please do not abuse the system again.\
 If you're not sure whether or not something should be voted for, double check with a staff member.`,
    color: 13441048,
    author: {
      name: 'Allowvote Success',
      icon_url: config.images.v3rmLogo,
    },
    fields: lastReasonField(lastReason),
  },
})

const reasonListed = (senderId, config, lastReason) => ({
  embed: {
    description: `<@${senderId}> is not currently allowed to votemute.`,
    color: 13441048,
    author: {
      name: 'Allowvote Success',
      icon_url: config.images.v3rmLogo,
    },
    fields: lastReasonField(lastReason),
  },
})

exports.run = async (client, message, args) => {
  const user = args.argMap.users[0] || null
  if (!user) return null
  const force = args.raw.includes('force') && message.member.hasPermission('ADMINISTRATOR')
  const reason = args.raw.includes('reason') && !force

  const {
    lastDenyReason, perm, exists, onSecondChance,
  } = await alreadyOnDenylist({ serverId: message.guild.id, id: user })
  if (perm) {
    if (!force) {
      return message.channel.send(
        permListed(user, client.config, lastDenyReason),
      ).then((m) => safeDelete(m, 15000))
    }
  }
  if (!exists || onSecondChance) {
    return message.channel.send(
      notDenylisted(user, client.config, lastDenyReason, onSecondChance),
    ).then((m) => safeDelete(m, 15000))
  }
  if (reason) return message.channel.send(reasonListed(user, client.config, lastDenyReason))
  await giveSecondChance(message.guild.id, user)
  return message.channel.send(chanceListed(user, client.config, lastDenyReason))
}
