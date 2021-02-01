const moment = require('moment')
const { addToToxic, getNextToxicLength } = require('../../../mongo/toxic')
const { genSpinner, sendResult } = require('../../functions/general')

const results = (code, message, details) => {
  let msgs = { title: '', desc: '' }
  switch (code) {
    case 1:
      msgs = {
        title: 'Success',
        desc: `Placed ${details.targetUser} in toxic for:\`\`\`${details.lastReason || 'General Toxicity'}\`\`\`\nTheir sentence will expire in ${moment(details.expireTime).fromNow()}`,
      }
      break
    case -1:
      msgs = { title: 'Unable to toxic', desc: 'The user needs to be in the server.' }
      break
    default:
      msgs = { title: 'Unable to toxic', desc: 'An unknown error occured.' }
      break
  }
  sendResult(msgs.desc, { edit: true, message }, msgs.title)
}

const getTime = async ({ timeArgs, numbers }, toxicInfo) => {
  if (timeArgs?.[0]) return timeArgs[0]
  if (numbers?.[0]) return Date.now() + parseInt(numbers[0], 10) * (3600000)
  return Date.now() + await getNextToxicLength(toxicInfo)
}

const maxInt = 360000000000000
exports.run = async (client, message, { argMap }) => { // eslint-disable-line no-unused-vars
  const { guild } = message
  const { users, inQuotes, specialReason } = argMap
  const pendingMsg = await message.channel.send(genSpinner('Placing user in toxic...'))
  const targetUser = await guild.members.fetch(users[0]).catch(() => {})
  if (!targetUser) { results(-1, pendingMsg, null); return }
  const eTime = await getTime(argMap, { serverId: guild.id, id: targetUser.id })
  const expireTime = eTime > maxInt ? maxInt : eTime
  const lastReason = inQuotes?.[0] || specialReason

  addToToxic({
    id: targetUser.id,
    serverId: guild.id,
    lastReason,
    expireTime,
  })

  targetUser.roles.add(await guild.roles.fetch(guild.ver.roles.toxic))
  results(1, pendingMsg, { targetUser, expireTime, lastReason })
}
