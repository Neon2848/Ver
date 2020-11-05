const { msgIntegrityCheck } = require('../functions/general')
const { checkWordFilters } = require('../functions/moderation')
const { logMessage } = require('../functions/moderation/logger')

module.exports = async (client, oldMessage, newMessage) => {
  if (!msgIntegrityCheck(oldMessage) || !msgIntegrityCheck(newMessage)) return
  if (oldMessage.cleanContent === newMessage.cleanContent) return
  checkWordFilters(client, newMessage)
  logMessage(client, oldMessage, newMessage)
}
