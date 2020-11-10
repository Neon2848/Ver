/* eslint-disable no-console */
const mongoose = require('mongoose')
const { getV3rmId } = require('./members')
const leaderboardSchema = require('./schemas/leaderboard')

const Leaderboard = mongoose.model('leaderboard', leaderboardSchema)

const addPoint = async (serverId, id) => {
  const v3rmId = await getV3rmId(serverId, id)

  // "$or: the operation stops evaluation after encountering the first true expression"
  // This means that we will prioritize searching by v3rmId, and fallback to id.
  const query = {
    serverId,
    $or: [
      { v3rmId },
      { id },
    ],
  }

  const thePoint = {
    id,
    lastVoted: new Date(),
    v3rmId,
  }
  const res = await Leaderboard.findOneAndUpdate(query, {
    $set: thePoint,
    $inc: { points: 1 },

  }, { upsert: true, new: true, setDefaultsOnInsert: true })
  return res
}

const getLBUser = async (serverId, id) => {
  const v3rmId = await getV3rmId(id)
  const res = await Leaderboard.aggregate([
    { $sort: { points: -1 } },
    {
      $group: {
        _id: false,
        users: {
          $push: {
            _id: '$_id', serverId: '$serverId', id: '$id', v3rmId: '$v3rmId', points: '$points',
          },
        },
      },
    },
    { $unwind: { path: '$users', includeArrayIndex: 'ranking' } },
    {
      $match: { 'users.serverId': serverId, $or: [{ 'users.v3rmId': v3rmId }, { 'users.id': id }] },
    },
  ])
  return res?.[0]
}

const getLeaderboard = async (serverId, limit = 10) => {
  const res = await Leaderboard.aggregate([
    { $match: { serverId } },
    {
      $lookup: {
        from: 'members', localField: 'v3rmId', foreignField: 'v3rmId', as: 'member',
      },
    },
  ]).sort({ points: -1 }).limit(limit)
  return res
}

module.exports = { addPoint, getLBUser, getLeaderboard }
