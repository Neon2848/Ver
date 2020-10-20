const mongoose = require('mongoose')
const util = require('util')
const actionLogSchema = require('./schemas/actionLog')

const Logs = mongoose.model('logs', actionLogSchema)

const log = (server, type, action, issue, data) => {
  Logs.findOneAndUpdate({ serverId: server }, {
    $push: {
      logs: {
        type,
        action,
        issue,
        timestamp: new Date(),
        data: util.inspect(data),
      },
    },
  }, { upsert: true, useFindAndModify: false })
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

module.exports = log
