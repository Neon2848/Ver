const log = require('../../mongo/log')

module.exports = {
  sendingMessage: (message, err) => {
    if (message.channel.type === 'dm') return log(message.channel.id, 'error', 'sending message', err, message)
    return log(message.guild.id, 'error', 'sending message', err, message)
  },
  fetchingData: (err) => log('global', 'error', 'fetching data', `${err.name} - ${err.type}`, err.message),
  userOperation: (err, server, action = 'kicking user') => log(server, 'error', action, `${err.name} - ${err.type}`, err.message),
  savingUser: (err, server, details) => log(server, 'error', 'Saving Member', err, details),
}
