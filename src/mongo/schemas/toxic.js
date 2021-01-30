const mongoose = require('mongoose')

const { Schema } = mongoose

const statsSchema = new Schema({
  serverId: { type: String },
  v3rmId: { type: Number },
  expireTime: { type: Date },
  entryTime: { type: Date, default: Date.now() },
  lastToxicLength: { type: Number },
  lastReason: { type: String, default: 'No reason provided.' },
})

module.exports = statsSchema
