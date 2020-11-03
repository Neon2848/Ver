const { checkWordFilters } = require('../functions/moderation')
const { logMessage } = require('../functions/moderation/logger')

module.exports = async (client, oldMessage, newMessage) => {
  checkWordFilters(client, newMessage)

  if (oldMessage.cleanContent === newMessage.cleanContent) return
  logMessage(client, oldMessage, newMessage)
}
