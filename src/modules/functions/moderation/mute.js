const moment = require('moment')
const { sendResult } = require('../general')
const { upsertMute, getAndUnmute } = require('../../../mongo/mute')
const { addtoRoleQueue, attemptRoleQueue } = require('../api/v3rm/userSetup')
const { getAndDetox } = require('../../../mongo/toxic')

const muteMember = async (guild, member, details, message) => {
  const insertMute = await upsertMute(guild.id, member.id, details)
  const muteRole = await guild.roles.fetch(guild.ver.roles.muted)

  if (member.roles) { // Could be member or author, if the member left.
    await member.roles.add(muteRole).catch(() => {
      addtoRoleQueue(member.id, member, null, [muteRole.name])
        .then(() => attemptRoleQueue())
    })
  }

  if (!message) return insertMute
  const mutedUntil = moment().to(details.unmuteTime || Date.now() + 600000)
  sendResult(
    `Muted <@${member.user?.id || member.id}>${details.muteReason ? ` for \`${details.muteReason}\`` : ''}.\
 Unmuting ${mutedUntil}`,
    { message, timeout: 10000 }, 'User Muted',
  )
  return insertMute
}

const unpunishLoop = async (members, removeMembers, removeRole) => {
  members.forEach(async (memb) => {
    if (removeMembers.includes(memb.id)) {
      await memb.roles.remove(removeRole).catch(() => {})
    }
  })
  return true
}

let muteDebounce = false
const unpunishMembers = async (guild) => {
  if (muteDebounce) return
  muteDebounce = true

  const allRoles = await guild.roles.fetch()
  const mutedMembers = allRoles.cache.get(guild.ver.roles.muted).members
  const toxicMembers = allRoles.cache.get(guild.ver.roles.toxic).members
  const mutedIds = mutedMembers.map((m) => m.id)
  const toxicIds = toxicMembers.map((m) => m.id)
  // Send a list of currently muted punished to the database, which will return the list of those
  // specific members who need to be unpunished.
  const detoxMembers = await getAndDetox(guild.id, toxicIds)
  const unmutedMembers = await getAndUnmute(guild.id, mutedIds)
  await unpunishLoop(mutedMembers, unmutedMembers, guild.ver.roles.muted)
  await unpunishLoop(toxicMembers, detoxMembers, guild.ver.roles.toxic)
  muteDebounce = false
}

module.exports = { muteMember, unpunishMembers }
