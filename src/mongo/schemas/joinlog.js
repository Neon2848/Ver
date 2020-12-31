const mongoose = require('mongoose')

const { Schema } = mongoose

const joinSchema = new Schema({
  serverId: { type: String },
  id: { type: String },
  messageId: { type: String },
})

module.exports = joinSchema
