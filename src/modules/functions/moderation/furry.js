const { sendResult } = require('../general')

const checkFurry = async (client, message) => {
  const { guild, member } = message
  const furryRole = await guild.roles.fetch(guild.ver.roles.furry)
  const furryStrings = ['owo', 'uwu', 'awoo', 'rawr', 'nuzzles', 'x3', 'x3c', ':3', ':3c']

  if (!member.roles.has(furryRole)) {
    const contentArray = message.content.split(' ')
    if (contentArray.some((word) => furryStrings.includes(word.toLowerCase()))) {
      member.roles.add(furryRole)
      sendResult(`<@${member.id}>, you've yee'd your last haw.`,
        { message, timeout: 5000 }, 'You Darned Furry!')
    }
  }
}

module.exports = { checkFurry }
