const mongoose = require('mongoose')

const { Schema } = mongoose

const membersSchema = new Schema({
  serverId: { type: String },
  lastUpdated: { type: Date, Default: new Date() },
  id: { type: String },
  v3rmId: { type: Number },
  tags: { type: Array },
  displayName: { type: String },
  joinedAt: { type: Date },
  topRole: { type: Object },
  topRoleName: { type: String },
  topRoleColor: { type: Number },
})

module.exports = membersSchema
