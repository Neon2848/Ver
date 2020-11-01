/* eslint-disable no-param-reassign */
const moment = require('moment')
const { sendResult } = require('../general')
const { upsertMute, getAndUnmute, getNextUnmuteMuteTime } = require('../../../mongo/mute')
const { addtoRoleQueue, attemptRoleQueue } = require('../api/v3rm/userSetup')

let mutedRole = null
const getMutedRole = (guild) => {
  if (!mutedRole) {
    mutedRole = guild.roles.cache.filter((r) => r.name === guild.giuseppeSettings.roleMuted).first()
    return mutedRole
  }
  return mutedRole
}

const muteMember = async (guild, member, details, message) => {
  const insertMute = await upsertMute(guild.id, member.user.id, details)
  await member.roles.add(getMutedRole(guild)).catch(() => {
    addtoRoleQueue(member.id, member, null, [getMutedRole(guild).name])
      .then(() => attemptRoleQueue())
  })

  // Force the settings to update with the next unmute time.
  guild.giuseppeSettings.nextUnmute = await getNextUnmuteMuteTime(guild.id)

  const mutedUntil = moment().to(insertMute.unmuteTime)
  sendResult(
    `Muted <@${member.user.id}>${insertMute.muteReason ? ` for \`${insertMute.muteReason}\`` : ''}.\
 Unmuting ${mutedUntil}`,
    { message, timeout: 10000 }, 'User Muted',
  )
}

const unmuteMembers = async (guild) => {
  const { giuseppeSettings: { nextUnmute } } = guild
  if (nextUnmute === -1 || Date.now() < nextUnmute) return
  const mutedMembers = getMutedRole(guild).members
  const mutedIds = mutedMembers.map((m) => m.id)
  const unmutedMembers = await getAndUnmute(guild.id, mutedIds)
  mutedMembers.forEach((memb) => {
    if (unmutedMembers.includes(memb.id)) memb.roles.remove(getMutedRole(guild)).catch(() => {})
  })
  guild.giuseppeSettings.nextUnmute = await getNextUnmuteMuteTime(guild.id)
}

module.exports = { muteMember, unmuteMembers }
