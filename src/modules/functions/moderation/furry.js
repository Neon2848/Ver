const { sendResult } = require('../general')
const { addtoRoleQueue, attemptRoleQueue } = require('../api/v3rm/userSetup')

const checkFurry = async (client, message) => {
  const { guild, member } = message
  const furryRole = await guild.roles.fetch(guild.ver.roles.furry)
  const furryStrings = ['owo', 'uwu', 'awoo']

  if (!member.roles.has(furryRole)) {
    if (new RegExp(furryStrings.join('|')).test(message.content)) {
      if (member.roles) {
        await member.roles.add(furryRole).catch(() => {
          addtoRoleQueue(member.id, member, null, [furryRole.name])
            .then(() => attemptRoleQueue())
        })
      }
      sendResult(`<@${message.author.id}>, you've yee'd your last haw.`,
        { message, timeout: 5000 }, 'You Darned Furry!')
    }
  }
}

module.exports = { checkFurry }
