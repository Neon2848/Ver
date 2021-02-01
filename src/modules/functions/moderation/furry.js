const { sendResult } = require('../general')

const checkFurry = async (client, message) => {
  const { guild, member } = message
  const furryRole = await guild.roles.fetch(guild.ver.roles.furry)
  const furryStrings = ['owo', 'uwu', 'awoo']

  if (!member.roles.has(furryRole)) {
    const contentArray = message.content.split(' ')
    for (const word of contentArray) {
      if (furryStrings.indexOf(word)) {
        member.roles.add(furryRole)
        sendResult(`<@${member.id}>, you've yee'd your last haw.`,
          { message, timeout: 5000 }, 'You Darned Furry!')
        break
      }
    }
  }
}

module.exports = { checkFurry }
