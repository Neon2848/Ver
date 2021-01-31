const { sendResult } = require('../general')

const checkFurry = async (client, message) => {
  const guild = message.guild
  const member = message.member
  const furryRole = await guild.roles.fetch(guild.ver.roles.furry)
  const furryStrings = ['owo', 'uwu', 'awoo']

  if (!member.roles.has(furryRole) {
    if (new RegExp(furryStrings.join("|")).test(message.content)) {
      if(member.roles) {
        await member.roles.add(furryRole).catch(() => {
          addtoRoleQueue(member.id, member, null, [furryRole.name])
            .then(() => attemptRoleQueue())
        });
      }
    }
    sendResult(`<@${message.author.id}>, you've yee'd your last haw.`,
      { message, timeout: 5000 }, 'You Darned Furry!')
  }
}

module.exports = { checkFurry }
