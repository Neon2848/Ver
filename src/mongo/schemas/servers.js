const mongoose = require('mongoose')

const { Schema } = mongoose

const serversSchema = new Schema({
  serverId: String,
  logs: {
    type: Array,
    default: {
      type: String,
      action: String,
      issue: String,
      timestamp: {
        type: Date,
        default: new Date(),
      },
      data: Object,
    },
  },
})

module.exports = serversSchema
