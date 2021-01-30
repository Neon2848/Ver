const mongoose = require('mongoose')
const { getV3rmId } = require('./members')
const toxicSchema = require('./schemas/toxic.js')
const membersSchema = require('./schemas/members')

const Toxic = mongoose.model('toxiclists', toxicSchema)
const Members = mongoose.model('members', membersSchema)

const addToToxic = async ({
  serverId, id, lastReason, expireTime,
}) => {
  const v3rmId = await getV3rmId(serverId, id)
  const query = { serverId, v3rmId }
  const ins = {
    lastReason,
    expireTime,
    lastToxicLength: expireTime - Date.now(),
  }
  const options = { upsert: true, new: true, setDefaultsOnInsert: true }

  const result = await Toxic.findOneAndUpdate(query, {
    $set: ins,
  }, options)

  return result
}

const oneHour = 60 * 60 * 1000
const maxInt = 360000000000000
const getNextToxicLength = async ({ serverId, id }) => {
  const v3rmId = await getV3rmId(serverId, id)
  const result = await Toxic.findOne({ serverId, v3rmId })
  if (!result) return oneHour

  const lastTime = Date.now() - result.expireTime
  // 5 days since last toxic
  if (lastTime > 432000000) {
    const reduceToxic = result.lastToxicLength / 2
    return reduceToxic > oneHour ? reduceToxic : oneHour
  }
  const increaseToxic = result.lastToxicLength * 2
  return increaseToxic > maxInt ? maxInt : increaseToxic
}

const notToxFilter = (id, toxFromDB) => !toxFromDB.map((member) => member.id).includes(id)
const unToxFilter = (r) => !r.toxic?.[0] || r.toxic[0].expireTime <= Date.now()

const getAndDetox = async (serverId, ids) => {
  const toxFromDB = await Members.aggregate([
    { $match: { serverId, id: { $in: ids } } },
    {
      $lookup: {
        foreignField: 'v3rmId',
        localField: 'v3rmId',
        as: 'toxic',
        from: 'toxiclists',
      },
    },
  ]).catch((_) => { throw _ })

  // Find toxic users whose time has expired or aren't in the toxic list at all.
  const notInToxic = ids.filter((id) => notToxFilter(id, toxFromDB))
  const unTox = toxFromDB.filter(unToxFilter)
  const deToxIds = unTox.map((m) => m.id)

  return [...deToxIds, ...notInToxic] || notInToxic
}

module.exports = {
  addToToxic, getNextToxicLength, getAndDetox,
}
