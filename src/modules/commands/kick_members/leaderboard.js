const { getLeaderboard, getLBUser } = require('../../../mongo/leaderboard')
const { getBar } = require('../../functions/api/quickchart')
const {
  genSpinner, toNameArray, toColorArray, toFieldArray, sendFile, sendResult,
} = require('../../functions/general')

const specificUser = async (message, uid) => {
  const usr = await getLBUser(message.guild.id, uid)
  if (!usr) {
    sendResult('This user does not have any approved votemutes logged', { message, edit: true }, 'Leaderboard Error')
    return
  }

  const ranking = usr.ranking + 1
  const { users: { points } } = usr
  sendResult(
    `<@${uid}> is at position \`${ranking}\` on the leaderboard with \`${points}\` approved votes`,
    { message, edit: true },
    'Votemute Points',
  )
}

const getPresentLeaderboard = async (leaderboard, guild) => {
  const serverMembers = await guild.members.fetch({ user: leaderboard.map((lb) => lb.id)})
  const nonStaff = serverMembers.filter((m) => !m.hasPermission('KICK_MEMBERS')).map((ns) => ns.id)
  return leaderboard.filter((lb) => nonStaff.includes(lb.id))
}

exports.run = async (client, message, args) => { // eslint-disable-line no-unused-vars
  const editable = await message.reply(genSpinner('Generating leaderboard...'))
  const limit = parseInt(args.argMap.numbers[0], 10) || 10
  const specify = args.argMap.users[0]

  if (specify) return specificUser(editable, specify)

  const lb = await getLeaderboard(message.guild.id, limit)
  const neededEntries = await getPresentLeaderboard(lb, message.guild)
  const labels = toNameArray(neededEntries)
  const colours = toColorArray(neededEntries)
  const data = toFieldArray(neededEntries, 'points')
  const buffer = await getBar(labels, data, colours, [])
  return sendFile(buffer, editable)
}
