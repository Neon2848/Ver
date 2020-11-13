const { raysAStart } = require('../../functions/moderation/raysA')

exports.run = async (client, message, args) => {
  const raysAID = args.argMap.users[0] || null
  if (!raysAID) return

  const messageToRaysA = await message.channel.messages.cache.get(raysAID)
  if (!messageToRaysA) return

  raysAStart(client, { messageReaction: null, sendMember: message.member, message: messageToRaysA })
}
