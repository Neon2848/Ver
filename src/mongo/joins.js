const mongoose = require('mongoose')
const joinSchema = require('./schemas/joinlog')

const Joinlog = mongoose.model('joinlog', joinSchema)

const logJoin = async (serverId, id, messageId) => {
  const query = { serverId, id }
  const theLog = {
    messageId,
  }
  const options = { upsert: true, new: false, setDefaultsOnInsert: true }

  const result = await Joinlog.findOneAndUpdate(query, { $set: theLog }, options)
  return result
}

const fetchJoin = async (serverId, id) => {
  const query = { serverId, id }
  const theLog = await Joinlog.findOne(query)
  if (!theLog) return null
  return theLog.messageId
}

const deleteJoin = async (serverId, id) => {
  const query = { serverId, id }
  await Joinlog.deleteOne(query)
}

module.exports = { logJoin, fetchJoin, deleteJoin }
