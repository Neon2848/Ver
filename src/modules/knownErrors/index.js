const mongo = require('../../mongo/connect')

module.exports = {
  sendingMessage: (message, err) => {
    if (message.channel.type === 'dm') return mongo.log(message.channel.id, 'error', 'sending message', err, message)
    return mongo.log(message.guild.id, 'error', 'sending message', err, message)
  },
  fetchingData: (err) => mongo.log('global', 'error', 'fetching data', `${err.name} - ${err.type}`, err.message),
  userOperation: (err, server) => mongo.log(server, 'error', 'kicking user', `${err.name} - ${err.type}`, err.message),
}