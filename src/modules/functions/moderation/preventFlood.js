const { sendResult } = require('../general')

const applySlowmode = (messageRate, message) => {
  const { channel } = message
  const { client: { config: { slowmode } } } = message
  if (messageRate < slowmode.messagesPer || channel.rateLimitPerUser > 0) return
  const mps = (messageRate / slowmode.pollingRate)

  channel.edit({ rateLimitPerUser: slowmode.seconds },
    `Message rate is currently ${mps.toFixed(2)}/mps.`)

  sendResult(
    `(sorry ☹️) This channel is under heavy use (${mps.toFixed(2)} messages/second). Slowmode will be disabled in ${Math.round(15000 * mps)} seconds.`,
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
