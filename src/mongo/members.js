const mongoose = require('mongoose')
const membersSchema = require('./schemas/members')

const Members = mongoose.model('members', membersSchema)

const addMember = (serverId, id, userData) => new Promise((resolve, reject) => {
  const query = { serverId, id }
  const theMember = { lastUpdated: Date.now(), ...userData }
  const options = {
    upsert: true, new: true, setDefaultsOnInsert: true, useFindAndModify: false,
  }

  Members.findOneAndUpdate(query, {
    $set: theMember,
    $addToSet: { tags: userData.tag },
  }, options, (err, succ) => {
    if (err) return reject(err)
    return resolve(succ)
  }).catch(reject)
})

module.exports = { addMember }
