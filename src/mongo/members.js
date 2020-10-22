const mongoose = require('mongoose')
const membersSchema = require('./schemas/members')

const Logs = mongoose.model('members', membersSchema)

const addMember = (serverId, id, userData) => new Promise((resolve, reject) => {
  const query = { serverId, id }

  const theMember = {
    lastUpdated: Date.now(),
    nickname: userData.nickname,
    joinedAt: userData.joinedAt,
    dmChannel: userData.dmChannel,
  }
  if (userData.v3rmId) theMember.v3rmId = userData.v3rmId

  const options = {
    upsert: true, new: true, setDefaultsOnInsert: true, useFindAndModify: false,
  }

  Logs.findOneAndUpdate(query, {
    $set: theMember,
    $addToSet: { tags: userData.tag },
  }, options, (err, succ) => {
    if (err) return reject(err)
    return resolve(succ)
  }).catch(reject)
})

module.exports = { addMember }
