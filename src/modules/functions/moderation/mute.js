/* eslint-disable no-param-reassign */
const moment = require('moment')
const { sendResult } = require('../general')
const { upsertMute, getAndUnmute, getNextUnmuteMuteTime } = require('../../../mongo/mute')
const { addtoRoleQueue, attemptRoleQueue } = require('../api/v3rm/userSetup')

const muteMember = async (guild, member, details, message) => {
  const insertMute = await upsertMute(guild.id, member.id, details)
  const muteRole = guild.roles.cache.get(guild.giuseppe.roles.muted)
  await member.roles.add(muteRole).catch(() => {
    addtoRoleQueue(member.id, member, null, [muteRole.name])
      .then(() => attemptRoleQueue())
  })

  // Force the settings to update with the next unmute time.
  guild.giuseppe.settings.nextUnmute = await getNextUnmuteMuteTime(guild.id)

  if (!message) return insertMute
  const mutedUntil = moment().to(details.unmuteTime || Date.now() + 600000)
  sendResult(
    `Muted <@${member.user.id}>${details.muteReason ? ` for \`${details.muteReason}\`` : ''}.\
 Unmuting ${mutedUntil}`,
    { message, timeout: 10000 }, 'User Muted',
  )
  return insertMute
}

const unmuteMembers = async (guild) => {
  const { giuseppe: { settings: { nextUnmute } } } = guild
  if (nextUnmute === -1 || Date.now() < nextUnmute) return
  const mutedMembers = guild.roles.cache.get(guild.giuseppe.roles.muted).members
  const mutedIds = mutedMembers.map((m) => m.id)
  const unmutedMembers = await getAndUnmute(guild.id, mutedIds)
  mutedMembers.forEach((memb) => {
    if (unmutedMembers.includes(memb.id)) {
      memb.roles.remove(guild.giuseppe.roles.muted).catch(() => {})
    }
  })
  guild.giuseppe.settings.nextUnmute = await getNextUnmuteMuteTime(guild.id)
}

module.exports = { muteMember, unmuteMembers }
