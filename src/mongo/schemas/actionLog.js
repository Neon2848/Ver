const mongoose = require('mongoose')

const { Schema } = mongoose

const actionLogSchema = new Schema({
  type: String,
  action: String,
  issue: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  data: Object,
})

module.exports = actionLogSchema
