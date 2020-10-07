const mongoose = require('mongoose')

const { Schema } = mongoose

const serversSchema = new Schema({
  serverId: String,
  serverName: String,
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
  settings: {
    lastLookup: { type: Date, default: Date.now },
    lookupTimeout: { type: Number, default: 30 },
    allowUsersToLookup: { type: Boolean, default: false },
  },
})

module.exports = serversSchema
