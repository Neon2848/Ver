const moment = require('moment')
const { getToxicDetails } = require('../../../mongo/toxic')
const { genSpinner, sendResult } = require('../../functions/general')

// eslint-disable-line no-unused-vars
exports.run = async (client, message, { argMap: { users } }) => {
  const id = users[0] || message.author.id
  if (message.member.id !== message.author.id && !message.member.hasPermission('KICK_MEMBERS')) return
  const toxicDetails = await getToxicDetails({ serverId: message.guild.id, id })
  if (!toxicDetails) return
  const pendingMsg = await message.channel.send(genSpinner('Fetching toxic details...'))

  sendResult(
    `You were placed in toxic for: \`\`\`${toxicDetails.lastReason || 'General Toxicity'}\`\`\`\nYour sentence will expire ${moment(toxicDetails.expireTime).fromNow()}`,
    { message: pendingMsg, edit: true },
    'Why am I here? How did this happen?',
  )
}
