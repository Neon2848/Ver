const lookup = require('../functions/lookup')
const config = require('../../../config.json')

const genError = (errMsg, errTitle = 'Lookup Error') => ({
  embed: {
    description: `${errMsg === 'Input malformatted' ? 'There was an issue with your input. Please use `!lookup @User` or `!lookup id`' : errMsg}.`,
    color: 13441048,
    author: {
      name: errTitle,
      icon_url: config.images.v3rmLogo,
    },
  },
})

exports.run = (client, message, args) => { // eslint-disable-line no-unused-vars
  if (!message.member || !message.member.hasPermission('KICK_MEMBERS')) return

  const cleanArg = args[0].match(/^<?@?!?([0-9]{12,32})>?$/) // Match id or <@!id>
  if (!cleanArg || !cleanArg[1]) {
    message.channel.send(genError('Input malformatted'))
    return
  }

  message.reply({
    embed:
      {
        color: 16674701,
        author: {
          name: 'Looking Up User...',
          icon_url: config.images.loader,
        },
      },
  }).then((editable) => {
    lookup(cleanArg[1]).then((details) => {
      const guildMember = editable.guild.members.cache.find((m) => m.id === cleanArg[1])

      if (guildMember && !details.roles.includes('Administrator')) { // Member we're looking for is in the server, so update roles and username.
        if (!details.roles.length) {
          editable.channel.send(`<@${cleanArg[1]}> is: ${config.urls.v3rm.profileURL}${details.uid}`, { allowedMentions: { users: [] } })
          guildMember.send('Sorry, there was an issue checking your account. Try re-linking on our website.').finally(() => {
            editable.edit(genError('The user exists, but they don\'t have any permissions. They may be unactivated.'))
            guildMember.kick('User did not have any usergroups assigned.')
          })
          return
        }
        if (details.roles.includes('Banned')) {
          editable.channel.send(`<@${cleanArg[1]}> is: ${config.urls.v3rm.profileURL}${details.uid}`, { allowedMentions: { users: [] } })
          guildMember.send('Sorry, because you are banned on site you may not use our Discord. If your ban is temporary you can rejoin when it expires.').finally(() => {
            editable.edit(genError('The user exists but is banned. They have now been removed from the server.', 'User is banned.'))
            guildMember.kick('User is banned onsite.')
          })
          return
        }
        const guildRoles = editable.guild.roles.cache
        const rolesToAdd = details.roles
          .map((role) => guildRoles.find((guildRole) => guildRole.name === role))
        const newName = guildMember.user.username === details.username ? `${guildMember.user.username}\u200E` : details.username
        guildMember.roles.add(rolesToAdd).catch((err) => editable.channel.send(genError(`There was an error assigning roles to this user: \`${err}\``)).then((errorMessage) => errorMessage.delete({ timeout: 5000 })))
        guildMember.setNickname(newName).catch((err) => editable.channel.send(genError(`There was an error setting this user's nickname: \`${err}\``)).then((errorMessage) => errorMessage.delete({ timeout: 5000 })))
      }

      editable.guild.roles.cache.get()
      editable.channel.send(`<@${cleanArg[1]}> is: ${config.urls.v3rm.profileURL}${details.uid}`, { allowedMentions: { users: [] } }).then(editable.delete())
    }).catch((err) => editable.edit(genError(err))
      .then((errorMessage) => errorMessage.delete({ timeout: 10000 })))
  })
}
