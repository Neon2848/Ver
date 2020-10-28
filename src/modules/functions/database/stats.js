const io = require('@pm2/io')
const { addMessage } = require('../../../mongo/stats')
const { getUserData } = require('./members')

let statQueue = []
const statQueueMetric = io.metric({
  name: 'Stat Queue Size',
  type: 'histogram',
  measurement: 'mean',
})

const findFromStatQueue = (id, server, date) => {
  let foundMember = null
  statQueue.some((entry, index) => {
    if (entry.id === id && entry.serverId === server && entry.date.valueOf() === date.valueOf()) {
      foundMember = index
      return true
    }
    return false
  })
  return foundMember
}

const storeStatQueue = async () => {
  const tempStatQueue = [...statQueue] // Copy the queue in case it's added to during the DB dump.
  tempStatQueue.map((stat) => addMessage(
    stat.serverId,
    stat.id,
    stat.date,
    { messages: stat.messages, pTo: stat.pTo, pFrom: stat.pFrom },
    stat.userData,
  ))
  Promise.all(tempStatQueue).then(() => {
    // Remove only matching entries, in case statQueue has been added to.
    statQueue = statQueue.filter((s) => !tempStatQueue.includes(s))
    statQueueMetric.set(statQueue.length)
  })
}

const addOneToStatQueue = async (id, createdAt, serverId, opt, userData = null) => {
  const existingInQueue = findFromStatQueue(id, serverId, createdAt)
  const eMember = statQueue[existingInQueue] || { messages: 0, pFrom: 0, pTo: 0 }

  const incObj = {
    serverId,
    id,
    date: createdAt,
    messages: eMember.messages + (opt.receiving ? 0 : 1), // They are sending a message if 1
    pTo: eMember.pTo + (opt.receiving ? 1 : 0), // They are being pinged if 1
    pFrom: eMember.pFrom + (opt.pinging ? 1 : 0), // They are pinging someone if 1
    userData,
  }

  if (existingInQueue !== null) statQueue[existingInQueue] = incObj
  else statQueue.push(incObj)
}

const messageStatQueue = async (client, message) => {
  const serverId = message.guild.id
  const { member: { id }, createdAt } = message
  createdAt.setHours(createdAt.getHours(), 0, 0, 0)

  const pings = message.mentions.users.filter((u) => u.id !== message.member.id)
  const pingPromises = pings.map((p) => addOneToStatQueue(
    p.id,
    createdAt,
    serverId,
    { receiving: true },
  ))
  pingPromises.push(addOneToStatQueue(
    id,
    createdAt,
    serverId,
    { pinging: !!pings?.size || 0 },
    getUserData(message.member),
  ))
  await Promise.all(pingPromises)

  statQueueMetric.set(statQueue.length)
  if (statQueue.length >= client.config.memory.maxStatQueue) await storeStatQueue()
}

module.exports = { messageStatQueue }
