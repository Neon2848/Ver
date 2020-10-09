/* eslint-disable consistent-return */
const lookup = require('../functions/lookup')
const config = require('../../../config.json')
const secrets = require('../../../secrets.json')
const { sendResult, kickUser, genSpinner } = require('../functions')

exports.run = async (client, message, args, type = 'lookup') => { // eslint-disable-line no-unused-vars
  const discordid = args.argMap.users[0] || null
  if (!discordid) return sendResult('Input malformatted', { message })
  let deleting = true
  const editable = await message.reply(genSpinner('Looking up user...'))
  const details = await lookup(discordid, editable.guild.id, { bypass: message.member.hasPermission('KICK_MEMBERS'), type }).catch((err) => {
    sendResult(err.message.replace(`${secrets.v3rm.api.base}`, 'apibase').replace(`${secrets.v3rm.api.lookup}`, 'lookup'), { message: editable, edit: true, timeout: 10000 }, 'Lookup error')
  })
  if (!details) return
  const guildMember = editable.guild.members.cache.find((m) => m.id === discordid)
  if (guildMember) { // Member we're looking for is in the server, so update roles and username.
    if (details.roles.includes('Banned') || !details.roles.length) {
      deleting = false
      kickUser(guildMember, editable, {
        dm: 'Your site account is either banned or unactivated. Once this is resolved, you will be allowed to join our server.',
        channel: 'The user does not have access to the site. They have now been removed from the server',
        log: 'User does not have permissions on site.',
      })
    } else {
      const gRoles = editable.guild.roles.cache
      const rolesToAdd = details.roles.map((role) => gRoles.find((guildRole) => guildRole.name === role && guildRole.name !== 'Member')).filter((r) => !!r)
      rolesToAdd.push(gRoles.find((r) => r.name === 'Member')) // Might not have "member" ug if VIP/Elite. Needed for heirarchical perms.
      const msgDetails = { message: editable, timeout: 5000 }
      guildMember.setNickname(guildMember.user.username === details.username ? `${guildMember.user.username}\u200E` : details.username).catch((e) => sendResult(`Error setting nickname: \`${e}\``, msgDetails, 'Lookup error'))
      if (rolesToAdd.length) guildMember.roles.add(rolesToAdd).catch((e) => sendResult(`Unable to set this users roles: \`${e}\``, msgDetails, 'Lookup error'))
    }
  }
  editable.channel.send(`<@${discordid}> is: ${config.urls.v3rm.profileURL}${details.uid}`, { allowedMentions: { users: [] } }).then(() => { if (deleting) editable.delete() })
}
