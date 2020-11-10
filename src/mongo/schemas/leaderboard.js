const mongoose = require('mongoose')

const { Schema } = mongoose

const leaderboardSchema = new Schema({
  serverId: { type: String },
  lastVoted: { type: Date, Default: new Date() },
  id: { type: String },
  v3rmId: { type: Number },
  points: { type: Number, Default: 0 },

})

module.exports = leaderboardSchema
