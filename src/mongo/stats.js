const mongoose = require('mongoose')
const { addMember } = require('./members')
const statsSchema = require('./schemas/stats')

const Stats = mongoose.model('UserStats', statsSchema)

const addMessage = (serverId, userId, date, stats, ud = null) => new Promise((resolve, reject) => {
  const query = { serverId, id: userId, date }
  const update = {
    $inc: {
      messages: stats.messages,
      pTo: stats.pTo,
      pFrom: stats.pFrom,
    },
  }
  const options = { upsert: true, useFindAndModify: false }

  Stats.findOneAndUpdate(query, update, options, (err, succ) => {
    if (err) return reject(err)

    if (ud) addMember(serverId, userId, ud).then(() => resolve(succ))
  })
})

const getServerStats = (serverId, timeframe) => new Promise((resolve, reject) => {
  const query = { serverId, date: { $gte: new Date(Date.now() - timeframe) } }
  Stats.find(query, (err, res) => {
    if (err) return reject(err)
    return resolve(res)
  })
})

module.exports = { addMessage, getServerStats }
