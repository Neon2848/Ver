const mongoose = require('mongoose')
const knownErrors = require('../modules/knownErrors')
const membersSchema = require('./schemas/members')

const Members = mongoose.model('members', membersSchema)

const addMember = async (serverId, id, userData) => {
  const query = { serverId, id }
  const theMember = { lastUpdated: Date.now(), ...userData }
  const options = {
    upsert: true, new: true, setDefaultsOnInsert: true,
  }

  const succ = await Members.findOneAndUpdate(query, {
    $set: theMember,
    $addToSet: { tags: userData.tag },
  }, options).catch((err) => knownErrors.savingUser(err, serverId, { id, userData }))
  return succ
}

module.exports = { addMember }
