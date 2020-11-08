const mongoose = require('mongoose')
const log = require('./log')
const { getV3rmId } = require('./members')
const deniedSchema = require('./schemas/denylist')

const Denylist = mongoose.model('denylist', deniedSchema)

const alreadyOnDenylist = async (query) => {
  let realQuery = null
  if (query.id) {
    const v3rmId = await getV3rmId(query.serverId, query.id)
    realQuery = v3rmId ? { serverId: query.serverId, v3rmId } : query
  }

  const entry = await Denylist.findOne(realQuery || query)
  return {
    exists: !!entry,
    perm: !!entry?.perm,
    onSecondChance: !!entry?.onSecondChance,
    lastDenyReason: entry?.denyMessageLink,
  }
}

const giveSecondChance = async (serverId, id) => {
  const v3rmId = await getV3rmId(serverId, id)
  const query = v3rmId ? { serverId, v3rmId } : { serverId, id }
  await Denylist.updateOne(query, { onSecondChance: true, perm: false })
}

const upsertDenylist = async (serverId, id, denyMessageLink) => {
  const v3rmId = await getV3rmId(serverId, id)
  const query = v3rmId ? { serverId, v3rmId } : { serverId, id }

  const preCheck = await alreadyOnDenylist(query)
  if (preCheck.perm) return

  const theMember = {
    id,
    lastDenyDate: Date.now(),
    denyMessageLink,
    perm: preCheck.exists, // If they're already on the blacklist, they're now on it for good.
    onSecondChance: false,
  }

  const options = {
    upsert: true, new: false, setDefaultsOnInsert: true,
  }

  await Denylist.findOneAndUpdate(query, {
    $set: theMember,
  }, options).catch((err) => log(serverId, 'error', 'Denylisting member', err, { id, ...theMember }))
}

module.exports = { alreadyOnDenylist, upsertDenylist, giveSecondChance }
