const { MessageEmbed } = require('discord.js')
const { upsertDenylist } = require('../../../mongo/denyvote')
const { addPoint } = require('../../../mongo/leaderboard')
const { logMessage } = require('./logger')

const logRaysAToApprovals = async (message, sendMember) => {
  const approval = await logMessage(message.guild.giuseppe.channels.voteApprovals, message)
  approval.raysA = {
    isApproval: true,
    initialChannel: message.channel.id,
    initialVoter: { id: sendMember.id, displayName: sendMember.displayName },
  }
  await approval.react('👍')
  await approval.react('👎')
  await approval.react('❌')
}

const updateApprovalLog = async (action, user, message) => {
  message.reactions.removeAll()
  const embed = new MessageEmbed(message.embeds[0])
  embed.addField('----', `\`\`\`${action} by ${user}\`\`\``)
  embed.setColor(0)
  const edited = await message.edit({ embed })
  return edited
}

const ignoreRays = async (message, sendMember) => updateApprovalLog('fix\nIgnored', sendMember.user.tag, message)

const approveRays = async (message, sendMember) => {
  if (message.raysA.isBeingApproved) return
  // eslint-disable-next-line no-param-reassign
  message.raysA.isBeingApproved = true
  const { raysA: { initialVoter: { id } } } = message
  const theMember = await message.guild.members.cache.get(id)
  if (!theMember) return

  await addPoint(message.guild.id, theMember.id)
  updateApprovalLog('diff\n+ Approved', sendMember.user.tag, message)
}

const denyRays = async (message, sendMember) => {
  const { raysA } = message
  const theLog = await updateApprovalLog('diff\n- Denied', sendMember.user.tag, message)
  const embed = theLog.embeds[0]
  embed.author.name = 'Votedelete Abuse'
  embed.fields = embed.fields.filter((f) => f.name !== '----')
  embed.description = null
  embed.addField('\u200E', `\`\`\`diff\n- ${sendMember.displayName} has decided that the initial voter (${raysA.initialVoter.displayName}) has abused the vote system. They have now been denylisted from the vote delete system.\`\`\``)
  const logMsg = await message.guild.channels.cache.get(raysA.initialChannel).send(`<@${sendMember.id}> <@${raysA.initialVoter.id}>`, { embed })
  await upsertDenylist(message.guild.id, raysA.initialVoter.id, `https://discordapp.com/channels/${logMsg.guild.id}/${logMsg.channel.id}/${logMsg.id}`)
}

module.exports = {
  logRaysAToApprovals, ignoreRays, approveRays, denyRays,
}
