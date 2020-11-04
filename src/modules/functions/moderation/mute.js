/* eslint-disable no-param-reassign */
const moment = require('moment')
const { sendResult } = require('../general')
const { upsertMute, getAndUnmute, getNextUnmuteMuteTime } = require('../../../mongo/mute')
const { addtoRoleQueue, attemptRoleQueue } = require('../api/v3rm/userSetup')

const muteMember = async (guild, member, details, message) => {
  const insertMute = await upsertMute(guild.id, member.user.id, details)
  const muteRole = guild.roles.cache.get(guild.giuseppe.roles.roleMuted)
  await member.roles.add(muteRole).catch(() => {
    addtoRoleQueue(member.id, member, null, [muteRole.name])
      .then(() => attemptRoleQueue())
  })

  // Force the settings to update with the next unmute time.
  guild.giuseppe.settings.nextUnmute = await getNextUnmuteMuteTime(guild.id)

  const mutedUntil = moment().to(insertMute.unmuteTime)
  sendResult(
    `Muted <@${member.user.id}>${insertMute.muteReason ? ` for \`${insertMute.muteReason}\`` : ''}.\
 Unmuting ${mutedUntil}`,
    { message, timeout: 10000 }, 'User Muted',
  )
}

const unmuteMembers = async (guild) => {
  const { giuseppe: { settings: { nextUnmute } } } = guild
  if (nextUnmute === -1 || Date.now() < nextUnmute) return
  const mutedMembers = guild.roles.cache.get(guild.giuseppe.roles.roleMuted).members
  const mutedIds = mutedMembers.map((m) => m.id)
  const unmutedMembers = await getAndUnmute(guild.id, mutedIds)
  mutedMembers.forEach((memb) => {
    if (unmutedMembers.includes(memb.id)) {
      memb.roles.remove(guild.giuseppe.roles.roleMuted).catch(() => {})
    }
  })
  guild.giuseppe.settings.nextUnmute = await getNextUnmuteMuteTime(guild.id)
}

module.exports = { muteMember, unmuteMembers }
