const { checkWordFilters } = require('../functions/moderation')

module.exports = async (client, oldMessage, newMessage) => {
  checkWordFilters(client, newMessage)
}
