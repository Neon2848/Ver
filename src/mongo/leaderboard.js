/* eslint-disable no-console */
const mongoose = require('mongoose')
const { getV3rmId } = require('./members')
const leaderboardSchema = require('./schemas/leaderboard')

const Leaderboard = mongoose.model('leaderboard', leaderboardSchema)

const addPoint = async (serverId, id) => {
  const v3rmId = await getV3rmId(serverId, id)
  const query = v3rmId ? { serverId, v3rmId } : { serverId, id }

  const thePoint = {
    id,
    lastVoted: new Date(),
  }
  const res = await Leaderboard.findOneAndUpdate(query, {
    $set: thePoint,
    $inc: { points: 1 },

  }, { upsert: true })
  return res
}

module.exports = addPoint
