const mongoose = require('mongoose')

const { Schema } = mongoose

const deniedSchema = new Schema({
  serverId: { type: String },
  lastDenyDate: { type: Date, Default: new Date() },
  id: { type: String },
  v3rmId: { type: Number },
  denyMessageLink: { type: String },
  perm: { type: Boolean, Default: false },
  onSecondChance: { type: Boolean, Default: false },
})

module.exports = deniedSchema
