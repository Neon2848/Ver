const { sendResult, inCacheUpsert } = require('../general')
const { muteMember } = require('./mute')

const checkPings = async (client, message) => {
  const { config: { maxPings } } = client
  const nonSelf = message.mentions.users.filter((m) => m.id !== message.author.id)
  if (nonSelf.size < maxPings) return
  if (inCacheUpsert('pingAbuse', message, 3600)) {
    await muteMember(message.guild, message.member, { muteReason: 'Ping Abuse' }, message)
    return
  }

  sendResult(`<@${message.author.id}>, you're pinging too many people, please chill out or you'll get muted ☹️`,
    { message, timeout: 5000 }, 'Chill the fr*ck out dude!')
}

module.exports = { checkPings }
