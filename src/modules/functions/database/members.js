const { addMember } = require('../../../mongo/members')

const getUserData = (member, v3rmId = null) => ({
  displayName: member.displayName,
  joinedAt: member.joinedAt,
  tag: member.user.tag,
  topRoleName: member.roles.highest.name,
  topRoleColor: member.roles.highest.color,
  v3rmId,
})

const logMember = async (server, member, v3rmId = null) => {
  await addMember(server, member.id, getUserData(member, v3rmId))
}

module.exports = { getUserData, logMember }
