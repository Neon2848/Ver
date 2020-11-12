const mongoose = require('mongoose')
const log = require('./log')
const mutedSchema = require('./schemas/mutelist')
const { getV3rmId } = require('./members')
const membersSchema = require('./schemas/members')

const Muted = mongoose.model('mutelist', mutedSchema)
const Members = mongoose.model('members', membersSchema)

const upsertMute = async (serverId, id, muteDetails) => {
  const v3rmId = await getV3rmId(serverId, id)
  const query = v3rmId ? { serverId, v3rmId } : { serverId, id }
  const theMember = {
    id,
    lastMuted: Date.now(),
    muteReason: muteDetails.muteReason,
    unmuteTime: new Date(muteDetails.unmuteTime || Date.now() + 600000),
  }
  const options = {
    upsert: true, new: false, setDefaultsOnInsert: true,
  }

  const succ = await Muted.findOneAndUpdate(query, {
    $set: theMember,
  }, options).catch((err) => log(serverId, 'error', 'Muting Member', err, { id, ...theMember }))

  if (succ && succ.unmuteTime <= Date.now()) return null
  return succ
}

const getNextUnmuteMuteTime = async (serverId) => {
  const nextUnmute = await Muted.find({ serverId }).sort({ unmuteTime: -1 }).limit(1)
  return nextUnmute?.[0]?.unmuteTime || -1
}

const getAndUnmute = async (serverId, ids) => {
  const now = Date.now()

  const mutedMembers = await Members.aggregate([
    { $match: { serverId, id: { $in: ids } } },
    {
      $lookup: {
        from: 'mutelists', localField: 'v3rmId', foreignField: 'v3rmId', as: 'muted',
      },
    },
  ]).catch((_) => { throw _ })

  // Find muted users whose time has expred, or who aren't in the muted list at all.
  const unMM = mutedMembers.filter((un) => !un.muted?.[0] || un.muted[0].unmuteTime <= now)
  const unmutedIds = unMM.map((m) => m.id)
  const unmutedV3rmIds = unMM.map((m) => m.v3rmId)
  await Muted.deleteMany({ v3rmId: { $in: unmutedV3rmIds } })
  return unmutedIds || []
}

module.exports = { upsertMute, getAndUnmute, getNextUnmuteMuteTime }
