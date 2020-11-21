const { addMember } = require('../../../mongo/members')

const getUserData = (member, v3rmId = null, sRoles = null) => ({
  displayName: member.displayName,
  joinedAt: member.joinedAt,
  tag: member.user.tag,
  topRoleName: member.roles.highest.name,
  topRoleColor: member.roles.highest.color,
  extraRoles: sRoles,
  v3rmId,
})

const logMember = async (server, member, v3rmId = null, sRoles = null) => {
  await addMember(server, member.id, getUserData(member, v3rmId, sRoles))
}

module.exports = { getUserData, logMember }
