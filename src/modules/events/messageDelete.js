const { msgIntegrityCheck } = require('../functions/general')
const { logMessage } = require('../functions/moderation/logger')
const { checkMessageForRaysA } = require('../functions/moderation/raysA')

module.exports = async (client, message) => {
  if (!msgIntegrityCheck(message)) return
  await checkMessageForRaysA(message)
  logMessage(message.guild.giuseppe.channels.modLog, message)
}
