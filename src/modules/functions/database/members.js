const { addMember } = require('../../../mongo/members')

const getUserData = (member, v3rmId = null) => ({
  nickname: member.nickname,
  joinedAt: member.joinedAt,
  tag: member.user.tag,
  v3rmId,
})

const logMember = async (server, member, v3rmId = null) => {
  await addMember(server, member.id, getUserData(member, v3rmId))
}

module.exports = { getUserData, logMember }
