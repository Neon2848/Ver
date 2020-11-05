const mongoose = require('mongoose')
const knownErrors = require('../modules/knownErrors')
const membersSchema = require('./schemas/members')

const Members = mongoose.model('members', membersSchema)

const addMember = async (serverId, id, userData) => {
  Object.keys(userData).forEach((key) => {
    // eslint-disable-next-line no-param-reassign
    if (userData[key] === null) delete userData[key]
  })

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

const getExtraRoles = async (serverId, id) => {
  const succ = await Members.find({ serverId, id })
  if (!succ?.[0]) return []
  return succ?.[0].extraRoles
}

module.exports = { addMember, getExtraRoles }
