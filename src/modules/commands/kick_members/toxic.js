const moment = require('moment')
const { addToToxic, getNextToxicLength } = require('../../../mongo/toxic')
const { addtoRoleQueue, attemptRoleQueue } = require('../../functions/api/v3rm/userSetup')
const { genSpinner, sendResult } = require('../../functions/general')

const tDiff = (dateOne, dateTwo) => Math.round(moment(dateTwo).diff(dateOne, 'hours', true))

const results = (code, message, details) => {
  let msgs = { title: '', desc: '' }
  switch (code) {
    case 1:
      msgs = {
        title: 'Success',
        desc: `Successfully placed ${details.targetUser} in toxic for ${tDiff(new Date(), details.expireTime)} hour(s)`,
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
  if (timeArgs[0]) return timeArgs[0]
  if (numbers[0]) return Date.now() + parseInt(numbers[0], 10) * (3600000)
  return Date.now() + await getNextToxicLength(toxicInfo)
}

const maxInt = 360000000000000
exports.run = async (client, message, { argMap }) => { // eslint-disable-line no-unused-vars
  const { guild, member, member: { id } } = message
  const { users, inQuotes } = argMap

  const pendingMsg = await message.channel.send(genSpinner('Placing user in toxic...'))
  const toxicRole = await guild.roles.fetch(guild.ver.roles.toxic)
  const targetUser = await guild.members.fetch(users[0]).catch(() => {})
  if (!targetUser) {
    results(-1, pendingMsg, null)
    return
  }
  const eTime = await getTime(argMap, { serverId: guild.id, id: targetUser.id })
  const expireTime = eTime > maxInt ? maxInt : eTime

  addToToxic({
    id: targetUser.id,
    serverId: guild.id,
    lastReason: inQuotes[0],
    expireTime,
  })

  await addtoRoleQueue(id, member, null, [toxicRole.name])
  await attemptRoleQueue()
  results(1, pendingMsg, { targetUser, expireTime })
}
