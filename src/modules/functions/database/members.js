const { addMember } = require('../../../mongo/members')

const filterSpecialRoles = (r) => {
  const { guild: { roles: { everyone: { id } } } } = r
  const transitions = Object.keys(r.guild.client.config.roleTranslations)
  return !transitions.includes(r.name) && id !== r.id
}

const getUserData = (member, v3rmId = null, sRoles = false) => {
  const { roles: { cache } } = member
  const extraRoles = sRoles ? cache
    .filter(filterSpecialRoles)
    .map((r) => ({ id: r.id, name: r.name })) : null
  return {
    displayName: member.displayName,
    joinedAt: member.joinedAt,
    tag: member.user.tag,
    topRoleName: member.roles.highest.name,
    topRoleColor: member.roles.highest.color,
    extraRoles,
    v3rmId,
  }
}

const logMember = async (server, member, v3rmId = null, sRoles = false) => {
  await addMember(server, member.id, getUserData(member, v3rmId, sRoles))
}

module.exports = { getUserData, logMember, filterSpecialRoles }
