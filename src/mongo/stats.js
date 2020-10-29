const mongoose = require('mongoose')
const { addMember } = require('./members')
const statsSchema = require('./schemas/stats')

const Stats = mongoose.model('UserStats', statsSchema)

const addMessage = async (serverId, userId, date, stats, ud = null) => {
  const query = { serverId, id: userId, date }
  const update = {
    $inc: {
      messages: stats.messages,
      pTo: stats.pTo,
      pFrom: stats.pFrom,
    },
  }
  const options = { upsert: true }

  await Stats.findOneAndUpdate(query, update, options)
  await addMember(serverId, userId, ud)
  return true
}

const getServerStats = async (serverId, timeframe, endFrame, limit = 5) => {
  const query = { serverId, date: { $gte: timeframe, $lte: endFrame } }
  const allStats = await Stats.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$id',
        messages: { $sum: '$messages' },
        pFrom: { $sum: '$pFrom' },
        pTo: { $sum: '$pTo' },
      },
    },
    {
      $lookup: {
        from: 'members', localField: '_id', foreignField: 'id', as: 'member',
      },
    },
    { $sort: { messages: -1, pTo: -1, pFrom: -1 } },
  ]).limit(limit).catch((_) => { throw _ })

  return allStats
}

const getUserStats = async (serverId, timeframe, endFrame, uid) => {
  const query = { serverId, date: { $gte: timeframe, $lte: endFrame }, id: uid }

  const succ = await Stats.find(query)
    .sort({ date: 1 })
    .catch((_) => { throw _ })

  return succ
}

module.exports = { addMessage, getServerStats, getUserStats }
