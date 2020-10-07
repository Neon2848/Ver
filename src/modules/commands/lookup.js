/* eslint-disable consistent-return */
const lookup = require('../functions/lookup')
const config = require('../../../config.json')
const secrets = require('../../../secrets.json')

const sendError = (errMsg, caller, errTitle = 'Lookup Error') => {
  const emb = {
    embed: {
      description: `${errMsg === 'Input malformatted' ? 'There was an issue with your input. Please use `!lookup @User` or `!lookup id`' : errMsg}.`,
      color: 13441048,
      author: { name: errTitle, icon_url: config.images.v3rmLogo },
    },
  }
  const send = caller.edit ? caller.message.edit(emb) : caller.message.channel.send(emb)
  send.then((_) => {
    if (caller.timeout) {
      if (caller.edit) return caller.message.delete({ timeout: caller.timeout })
      return _.delete({ timeout: caller.timeout })
    }
    return true
  })
}

const kickUser = (member, editable) => {
  member.send('Your site account is either banned or unactivated. Once this is resolved, you will be allowed to join our server.').finally(() => {
    sendError('The user does not have access to the site. They have now been removed from the server.', { message: editable }, 'User not permitted')
    member.kick('User does not have permissions on site.')
  })
}

const getID = (args) => {
  const cleanArg = args[0].replace(/<@!/, '').replace('/>/', '').match(/[0-9]{12,32}/) // Match id or <@!id>
  if (!cleanArg || !cleanArg[0]) return null
  return cleanArg[0]
}

exports.run = (client, message, args, type = 'lookup') => { // eslint-disable-line no-unused-vars
  if (!message.member || !message.member.hasPermission('KICK_MEMBERS')) return
  const discordid = getID(args)
  if (!discordid) return sendError('Input malformatted', { message })

  message.reply({ embed: { color: 16674701, author: { name: 'Looking Up User...', icon_url: config.images.loader } } }).then((editable) => {
    lookup(
      discordid,
      editable.guild.id,
      { bypass: message.member.hasPermission('KICK_MEMBERS'), type },
    ).then((details) => {
      const guildMember = editable.guild.members.cache.find((m) => m.id === discordid)

      if (guildMember && !details.roles.includes('Administrator')) { // Member we're looking for is in the server, so update roles and username.
        if (details.roles.includes('Banned') || !details.roles.length) kickUser(guildMember, editable)
        else {
          const rolesToAdd = details.roles
            .map((role) => editable.guild.roles.cache.find((guildRole) => guildRole.name === role))
          const msgDetails = { message: editable, timeout: 5000 }
          guildMember.setNickname(guildMember.user.username === details.username ? `${guildMember.user.username}\u200E` : details.username).catch((e) => sendError(`Error setting nickname: \`${e}\``, msgDetails))
          guildMember.roles.add(rolesToAdd).catch((e) => sendError(`Unable to set this users roles: \`${e}\``, msgDetails))
        }
      }

      editable.channel.send(`<@${discordid}> is: ${config.urls.v3rm.profileURL}${details.uid}`, { allowedMentions: { users: [] } }).then(editable.delete())
    }).catch((err) => sendError(err.message
      .replace(`${secrets.v3rm.api.base}`, 'apibase')
      .replace(`${secrets.v3rm.api.lookup}`, 'lookup'), { message: editable, edit: true, timeout: 10000 }))
  })
}
