const mongoose = require('mongoose')
const statsSchema = require('./schemas/stats')

const Stats = mongoose.model('UserStats', statsSchema)

const addMessage = (serverId, userId, date, stats) => new Promise((resolve, reject) => {
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
    if (err) reject(err)
    resolve(succ)
  })
})

const getServerStats = (serverId) => new Promise((resolve, reject) => {
  const query = { serverId, date: { $gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) } }
  Stats.find(query, (err, res) => {
    if (err) reject(err)
    resolve(res)
  })
})

module.exports = { addMessage, getServerStats }
