const { msgIntegrityCheck } = require('../functions/general')
const { checkWordFilters } = require('../functions/moderation')
const { logMessage } = require('../functions/moderation/logger')
const { checkMessageForRaysA } = require('../functions/moderation/raysA')

module.exports = async (client, oldMessage, newMessage) => {
  if (!msgIntegrityCheck(oldMessage) || !msgIntegrityCheck(newMessage)) return
  if (oldMessage.cleanContent === newMessage.cleanContent) return

  await checkMessageForRaysA(newMessage)
  checkWordFilters(client, newMessage)
  logMessage(newMessage.guild.giuseppe.channels.modLog, oldMessage, newMessage)
}
