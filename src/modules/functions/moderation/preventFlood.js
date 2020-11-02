const { sendResult } = require('../general')

const applySlowmode = (messageRate, message) => {
  const { channel } = message
  if (messageRate < 2 || channel.rateLimitPerUser > 0) return
  channel.edit({ rateLimitPerUser: 5 }, `Message rate is currently ${messageRate}/second.`)

  sendResult(
    `This channel is under heavy use (${(messageRate * 60).toFixed(2)} messages/minute)`,
    { message }, 'Slowmode Enabled',
  )

  setTimeout(() => {
    sendResult('Removing automatic slowmode.', { message }, 'Slowmode Disabled')
    channel.edit({ rateLimitPerUser: 0 }, 'Removing slowmode')
  }, 60000)
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
  if (now - lastTick <= 10000) return

  applySlowmode((messages + 1) / 10, message)

  channel.giuseppeFloodCache.lastTick = now
  channel.giuseppeFloodCache.messages = 0
  /* eslint-enable no-param-reassign */
}

module.exports = { preventFlood }
