const lookup = require('../../functions/api/v3rm/lookup')
const {
  sendResult, kickUser, genSpinner, safeDelete,
} = require('../../functions/general')
const { basicUserSetup } = require('../../functions/api/v3rm/userSetup')
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
  if (e.message === 'Missing Permissions') translateError = new Error('This user has a higher role than me')
  sendResult(translateError.message, { message, timeout: 5000 }, 'Not setting roles/username.')
}

const updateOrKickMember = (guildMember, editable, details) => {
  if (details.roles.includes('Banned') || !details.roles.length) {
    kickUser(guildMember, editable, {
      dm: 'To prevent botting, you need to have been a member for at least 1 month and have at least 40 posts on our website to use our Discord. You don\'t seem to meet these standards yet, but you\'re welcome to join when you do.',
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
  if (!discordid) return
  const editable = await message.reply(genSpinner('Looking up user...'))

  const details = await lookup(discordid, editable.guild.id, { bypass: message.member.hasPermission('KICK_MEMBERS'), type }).catch((err) => sendError(err, editable))
  if (!details) return
  const guildMember = message.guild.members.cache.get(discordid)
  if (guildMember) logMember(message.guild.id, guildMember, details.uid)

  const kickedMember = updateOrKickMember(guildMember, editable, details)
  editable.channel.send(`<@${discordid}> is: ${client.config.urls.v3rm.profileURL}${details.uid}`, { allowedMentions: { users: [] } })
    .then(() => { if (!guildMember || kickedMember) safeDelete(editable, 0) })
}
