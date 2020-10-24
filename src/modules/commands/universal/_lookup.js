/* eslint-disable consistent-return */
const lookup = require('../../functions/api/lookup')
const {
  sendResult, kickUser, genSpinner,
} = require('../../functions')
const { basicUserSetup } = require('../../functions/api/userSetup')
const { logMember } = require('../../functions/database/members')

const sendError = (err, editable) => {
  sendResult(
    err.message,
    { message: editable, edit: true, timeout: 10000 },
    'Lookup error',
  )
}

const catchUpdateError = (e, message) => {
  let translateError = e
  if (e.message === "Cannot read property 'guild' of undefined") translateError = new Error('The user is not currently in the server')
  if (e.message === 'Missing Permissions') translateError = new Error('This user has a higher role then me')
  sendResult(translateError.message, { message, timeout: 5000 }, 'Not setting roles/username.')
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
  basicUserSetup(details, guildMember).catch((e) => { catchUpdateError(e, editable) })
  return true
}

exports.run = async (client, message, args, type = 'lookup') => { // eslint-disable-line no-unused-vars
  const discordid = args.argMap.users[0] || null
  if (!discordid) return sendResult('Input malformatted', { message })
  const editable = await message.reply(genSpinner('Looking up user...'))

  const details = await lookup(discordid, editable.guild.id, { bypass: message.member.hasPermission('KICK_MEMBERS'), type }).catch((err) => sendError(err, editable))
  if (!details) return
  logMember(message.guild.id, message.member, details.uid)

  const guildMember = editable.guild.members.cache.find((m) => m.id === discordid)
  const kickedMember = updateOrKickMember(guildMember, editable, details)
  editable.channel.send(`<@${discordid}> is: ${client.config.urls.v3rm.profileURL}${details.uid}`, { allowedMentions: { users: [] } })
    .then(() => { if (kickedMember) editable.delete() })
}
