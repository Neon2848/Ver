const mongoose = require('mongoose')
const knownErrors = require('../modules/knownErrors')
const membersSchema = require('./schemas/members')
const log = require('./log')

const Members = mongoose.model('members', membersSchema)

const getV3rmId = async (serverId, id) => {
  const succ = await Members.findOne({ serverId, id })
  if (succ) return succ.v3rmId
  return null
}

// eslint-disable-next-line max-lines-per-function
const addMember = async (serverId, id, userData) => {
  const v3rmId = parseInt(userData.v3rmId, 10) || await getV3rmId(serverId, id)
  if (!v3rmId) {
    log(serverId, 'error', 'logging member', 'no v3rmid present', { id, ...userData })
    return null
  }

  Object.keys(userData).forEach((key) => {
    // eslint-disable-next-line no-param-reassign
    if (!userData[key]) delete userData[key]
  })

  const query = { serverId, v3rmId }
  const theMember = {
    lastUpdated: Date.now(), id, v3rmId, ...userData,
  }
  const options = {
    upsert: true, new: true, setDefaultsOnInsert: true,
  }

  const succ = await Members.findOneAndUpdate(query, {
    $set: theMember,
    $addToSet: { tags: userData.tag },
  }, options).catch((err) => knownErrors.savingUser(err, serverId, { id, userData }))
  return succ
}

const getExtraRoles = async (serverId, id, v3rmId = null) => {
  const succ = await Members.find(v3rmId ? { serverId, v3rmId } : { serverId, id })
  if (!succ?.[0]) return []
  return succ?.[0].extraRoles
}

const findPartialUsers = async (serverId) => {
  const membs = await Members.find({
    serverId,
    $or: [{ v3rmId: { $exists: false } }, { v3rmId: null }, { v3rmId: undefined }],
  })
  const membIds = membs.map((m) => m.id)

  await Members.deleteMany({ id: { $in: membIds } })

  return membIds
}

module.exports = {
  addMember, getExtraRoles, getV3rmId, findPartialUsers,
}
