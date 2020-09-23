const mongoose = require('mongoose')
const util = require('util')
const secrets = require('../../secrets.json')

const serversSchema = require('./schemas/servers.js')

const Servers = mongoose.model('Servers', serversSchema)

const connect = () => {
  mongoose.connect(secrets.mongo.server, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
}

/**
 * @param {String} server server id
 * @param {String} type type of log [warning|error]
 * @param {String} action what it was doing
 * @param {String} issue what the problem was
 * @param {Object} data raw data
 */
const log = (server, type, action, issue, data) => {
  Servers.updateOne({
    serverId: server,
  }, {
    $push: {
      logs: {
        type,
        action,
        issue,
        timestamp: new Date(),
        data: util.inspect(data),
      },
    },
  }, { upsert: true })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.log({
        error: e,
        logMessage: {
          type, action, issue, timestamp: new Date(), data: util.inspect(data),
        },
      })
    })
}

module.exports = {
  log,
  connect,
}
