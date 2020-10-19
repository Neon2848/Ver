const { addMessage } = require('../../mongo/channelStats')

let statQueue = []

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
  ))
  Promise.all(tempStatQueue).then(() => {
    // Remove only matching entries, in case statQueue has been added to.
    statQueue = statQueue.filter((s) => !tempStatQueue.includes(s))
  })
}

const addOneToStatQueue = async (id, createdAt, serverId, opt) => {
  const existingInQueue = findFromStatQueue(id, serverId, createdAt)
  if (existingInQueue) {
    const eMember = statQueue[existingInQueue]
    statQueue[existingInQueue] = {
      serverId,
      id,
      date: createdAt,
      messages: eMember.messages + (opt.receiving ? 0 : 1),
      pTo: eMember.pTo + (opt.receiving ? 1 : 0),
      pFrom: eMember.pFrom + (opt.pinging ? 1 : 0),
    }
  } else {
    statQueue.push({
      serverId,
      id,
      date: createdAt,
      messages: opt.receiving ? 0 : 1,
      pTo: opt.receiving ? 1 : 0,
      pFrom: opt.pinging ? 1 : 0,
    })
  }
  return true
}

const messageStatQueue = async (client, message) => {
  const serverId = message.guild.id
  const { member: { id }, createdAt } = message
  createdAt.setHours(0, 0, 0, 0)

  const pings = message.mentions.users.filter((u) => u.id !== message.member.id)
  const pingPromises = pings.map((p) => addOneToStatQueue(
    p.id,
    createdAt,
    serverId,
    { receiving: true },
  ))
  pingPromises.push(addOneToStatQueue(id, createdAt, serverId, { pinging: !!pings?.size || 0 }))
  await Promise.all(pingPromises)

  if (statQueue.length >= 10) await storeStatQueue()
}

module.exports = { messageStatQueue }
