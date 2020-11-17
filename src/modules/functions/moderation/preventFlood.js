const { sendResult } = require('../general')
const { muteMember } = require('./mute')

const getMaxSender = async (messageRate, message) => {
  const last = await message.channel.messages.fetch({ limit: messageRate })
  const arr = last.map((m) => m.author.id)
  const maxId = arr
    .sort((a, b) => arr.filter((v) => v === a).length - arr.filter((v) => v === b).length).pop()
  return maxId
}

const muteMaxSender = async (messageRate, message, mps) => {
  const maxSender = await getMaxSender(messageRate, message)
  const maxMember = await message.guild.members.fetch(maxSender)
  if (maxMember) {
    muteMember(
      message.guild,
      maxMember,
      { unmuteTime: Math.round(Date.now() + 15 * 2 * mps * 1000), muteReason: 'Flooding chat' },
      message,
    )
    return maxMember
  }
  return null
}

const applySlowmode = async (messageRate, message) => {
  const { channel } = message
  const { client: { config: { slowmode } } } = message
  if (messageRate < slowmode.messagesPer || channel.rateLimitPerUser > 0) return
  const mps = (messageRate / slowmode.pollingRate)

  const maxSender = await muteMaxSender(messageRate, message, mps)

  channel.edit({ rateLimitPerUser: slowmode.seconds },
    `Message rate is currently ${mps.toFixed(2)}/mps.`)

  sendResult(
    `(sorry ☹️) This channel is under heavy use (\`${mps.toFixed(2)} messages/second\`). Slowmode will be disabled in \`${Math.round(15 * mps)}\` seconds.\n\n\
 Don't be mad at me, I'm just a bot. Be mad at <@${maxSender}>, who sent the most messages in the last few seconds`,
    { message }, 'Slowmode Enabled',
  )

  setTimeout(() => {
    sendResult('Removing automatic slowmode', { message }, 'Slowmode Disabled')
    channel.edit({ rateLimitPerUser: 0 }, 'Removing slowmode')
  }, Math.round(15000 * mps))
}

const preventFlood = async (client, message) => {
  /* eslint-disable no-param-reassign */
  const { channel } = message

  if (!channel.giuseppeFloodCache) {
    channel.giuseppeFloodCache = { messages: 0, lastTick: Date.now() }
  }
  const { giuseppeFloodCache: { messages, lastTick } } = channel

  channel.giuseppeFloodCache.messages += 1
  const now = Date.now()
  if (now - lastTick <= message.client.config.slowmode.pollingRate * 1000) return

  applySlowmode(messages + 1, message)

  channel.giuseppeFloodCache.lastTick = now
  channel.giuseppeFloodCache.messages = 0
  /* eslint-enable no-param-reassign */
}

module.exports = { preventFlood }
