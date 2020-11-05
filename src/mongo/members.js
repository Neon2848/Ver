const mongoose = require('mongoose')
const knownErrors = require('../modules/knownErrors')
const membersSchema = require('./schemas/members')
const { v3rm: { api: { enabled } } } = require('../../secrets.json')
const v3rmApi = require('../modules/functions/api/v3rm/apiCall')

const Members = mongoose.model('members', membersSchema)

const updateBasedOnv3rmID = async (serverId, id, userData) => {
  const query = { serverId, v3rmId: parseInt(userData.v3rmId, 10) }
  try {
    const succ = await Members.findOne(query)
    if (!succ) return null

    succ.id = id
    Object.keys(userData).forEach((k) => {
      succ[k] = userData[k]
    })
    await succ.save()

    return succ
  } catch (e) { return e }
}

// Eventually all users will have a v3rmID mapped to them, and this function
// will run very rarely.
const retrospectivelyAddv3rmID = async (memberResult) => {
  if (!enabled || memberResult.v3rmId) return memberResult
  // eslint-disable-next-line no-console
  console.log(`Retrospectively looking up: ${memberResult.id} (${memberResult.tags[0]})`)
  const lookup = await v3rmApi('lookup', `?id=${encodeURIComponent(memberResult.id)}`)
  if (!lookup?.uid) return memberResult
  // eslint-disable-next-line no-use-before-define
  const updated = await addMember(
    memberResult.serverId,
    memberResult.id,
    { v3rmId: lookup.uid },
  )
  return updated
}

const addMember = async (serverId, id, userData) => {
  Object.keys(userData).forEach((key) => {
    // eslint-disable-next-line no-param-reassign
    if (userData[key] === null) delete userData[key]
  })

  if (userData.v3rmId) {
    const nowUpdated = await updateBasedOnv3rmID(serverId, id, userData)
    if (nowUpdated !== null) return nowUpdated
  }

  const query = { serverId, id }
  const theMember = { lastUpdated: Date.now(), ...userData }
  const options = {
    upsert: true, new: true, setDefaultsOnInsert: true,
  }

  const succ = await Members.findOneAndUpdate(query, {
    $set: theMember,
    $addToSet: { tags: userData.tag },
  }, options).catch((err) => knownErrors.savingUser(err, serverId, { id, userData }))

  return retrospectivelyAddv3rmID(succ)
}

const getExtraRoles = async (serverId, id, v3rmId = null) => {
  const succ = await Members.find(v3rmId ? { serverId, v3rmId } : { serverId, id })
  if (!succ?.[0]) return []
  return succ?.[0].extraRoles
}

const getV3rmId = async (serverId, id) => {
  const succ = await Members.findOne({ serverId, id })
  if (succ) return succ.v3rmId
  return null
}

module.exports = { addMember, getExtraRoles, getV3rmId }
