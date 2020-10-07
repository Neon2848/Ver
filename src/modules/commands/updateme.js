const lookup = require('./lookup')

exports.run = (client, message, args) => { // eslint-disable-line no-unused-vars
  // Updateme is just an alias for lookup with a fixed ID.
  lookup.run(client, message, [message.author.id], 'updateme')
}
