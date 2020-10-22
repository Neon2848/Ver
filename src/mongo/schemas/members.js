const mongoose = require('mongoose')

const { Schema } = mongoose

const membersSchema = new Schema({
  serverId: { type: String },
  lastUpdated: { type: Date, Default: new Date() },
  id: { type: String },
  v3rmId: { type: Number },
  tags: { type: Array },
  nickname: { type: String },
  joinedAt: { type: Date },
})

module.exports = membersSchema
