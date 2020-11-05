const mongoose = require('mongoose')

const { Schema } = mongoose

const statsSchema = new Schema({
  serverId: { type: String },
  v3rmId: { type: Number },
  date: { type: Date },
  messages: { type: Number, default: 0 },
  pTo: { type: Number, default: 0 },
  pFrom: { type: Number, default: 0 },
})

module.exports = statsSchema
