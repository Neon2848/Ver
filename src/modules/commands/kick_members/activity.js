const { MessageAttachment } = require('discord.js')
const { getServerStats } = require('../../../mongo/stats')
const chart = require('../../functions/api/quickchart')

let lastCall = Date.now()
const maxCall = 15 * 1000

const checkCall = (member) => {
  if (member.hasPermission('KICK_MEMBERS')) return true
  if (maxCall - Math.abs(Date.now() - lastCall) > 0) return false
  lastCall = Date.now()
  return true
}

exports.run = async (client, message, args) => { // eslint-disable-line no-unused-vars
  if (!checkCall(message.member)) { message.delete().catch(() => {}); return false }
  const timeframe = args.argMap.timeArgs[0] - Date.now() || (7 * 24 * 60 * 60 * 1000)
  const oldTimeframe = new Date(Date.now() - timeframe)

  const sStats = await getServerStats(message.guild.id, timeframe)
  // console.log(sStats)

  const b = new MessageAttachment(await chart(['January', 'February', 'March', 'April', 'May'], [50, 60, 70, 180, 190], 'Message Activity', oldTimeframe), 'chart.png')
  message.channel.send({ files: [b] })
}
