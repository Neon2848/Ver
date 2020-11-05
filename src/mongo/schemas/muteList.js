const mongoose = require('mongoose')

const { Schema } = mongoose

const mutedSchema = new Schema({
  serverId: { type: String },
  lastMuted: { type: Date, Default: new Date() },
  unmuteTime: { type: Date },
  id: { type: String },
  v3rmId: { type: Number },
  muteReason: { type: String, Default: null },

})

module.exports = mutedSchema
