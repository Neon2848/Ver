const mongoose = require('mongoose')
const log = require('./log')
const mutedSchema = require('./schemas/muteList')

const Muted = mongoose.model('muteList', mutedSchema)

const upsertMute = async (serverId, id, muteDetails) => {
  const query = { serverId, id }
  const theMember = {
    lastMuted: Date.now(),
    muteReason: muteDetails.muteReason,
    unmuteTime: new Date(muteDetails.unmuteTime || Date.now() + 600000),
  }
  const options = {
    upsert: true, new: true, setDefaultsOnInsert: true,
  }

  const succ = await Muted.findOneAndUpdate(query, {
    $set: theMember,
  }, options).catch((err) => log(serverId, 'error', 'Muting Member', err, { id, ...theMember }))
  return succ
}

const getNextUnmuteMuteTime = async (serverId) => {
  const nextUnmute = await Muted.find({ serverId }).sort({ unmuteTime: -1 }).limit(1)
  return nextUnmute?.[0]?.unmuteTime || -1
}

const getAndUnmute = async (serverId, ids) => {
  const now = Date.now()
  const unmutedMembers = await Muted.find({ serverId, unmuteTime: { $lte: now }, id: { $in: ids } })
  const unmutedIds = unmutedMembers.map((m) => m.id)
  await Muted.deleteMany({ id: { $in: unmutedIds } })
  return unmutedIds || []
}

module.exports = { upsertMute, getAndUnmute, getNextUnmuteMuteTime }
