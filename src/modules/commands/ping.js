const knownErrors = require('../knownErrors')

exports.run = (client, message, args) => { // eslint-disable-line no-unused-vars
  if (!message || !message.channel) return
  message.channel.send('pong!').catch((err) => knownErrors.sendingMessage(message, err))
}
