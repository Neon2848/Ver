const mongoose = require('mongoose')

const { Schema } = mongoose

const logs = new Schema({
  type: String,
  action: String,
  issue: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  data: Object,
})

const actionLogSchema = new Schema({
  serverId: String,
  logs: [logs],
})

module.exports = actionLogSchema
