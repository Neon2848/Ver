const { msgIntegrityCheck } = require('../functions/general')
const { logMessage } = require('../functions/moderation/logger')

module.exports = async (client, message) => {
  if (!msgIntegrityCheck(message)) return
  logMessage(client, message)
}
