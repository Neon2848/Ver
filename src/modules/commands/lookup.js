/* eslint-disable consistent-return */
const lookup = require('../functions/lookup')
const config = require('../../../config.json')
const secrets = require('../../../secrets.json')
const {
  sendResult, kickUser, genSpinner, basicUserSetup,
} = require('../functions')

const sendError = (err, editable) => {
  sendResult(
    err.message.replace(`${secrets.v3rm.api.base}`, 'apibase').replace(`${secrets.v3rm.api.lookup}`, 'lookup'),
    { message: editable, edit: true, timeout: 10000 },
    'Lookup error',
  )
}

const updateOrKickMember = (guildMember, editable, details) => {
  if (details.roles.includes('Banned') || !details.roles.length) {
    kickUser(guildMember, editable, {
      dm: 'Your site account is either banned or unactivated. Once this is resolved, you will be allowed to join our server.',
      channel: 'The user does not have access to the site. They have now been removed from the server',
      log: 'User does not have permissions on site.',
    })
    return false
  }
  basicUserSetup(details, guildMember).catch((e) => { sendResult(`There was an issue setting nickname or roles: \`${e}\``, { message: editable, timeout: 5000 }, 'Lookup error') })
  return true
}

exports.run = async (client, message, args, type = 'lookup') => { // eslint-disable-line no-unused-vars
  const discordid = args.argMap.users[0] || null
  if (!discordid) return sendResult('Input malformatted', { message })
  const editable = await message.reply(genSpinner('Looking up user...'))

  const details = await lookup(discordid, editable.guild.id, { bypass: message.member.hasPermission('KICK_MEMBERS'), type }).catch((err) => sendError(err, editable))
  if (!details) return

  const guildMember = editable.guild.members.cache.find((m) => m.id === discordid)
  const kickedMember = updateOrKickMember(guildMember, editable, details)
  editable.channel.send(`<@${discordid}> is: ${config.urls.v3rm.profileURL}${details.uid}`, { allowedMentions: { users: [] } })
    .then(() => { if (kickedMember) editable.delete() })
}
