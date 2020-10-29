/* eslint-disable no-console */
const mongoose = require('mongoose')
const util = require('util')
const actionLogSchema = require('./schemas/actionLog')

const Logs = mongoose.model('logs', actionLogSchema)

const log = (server, type, action, issue, data) => {
  const theLog = {
    type,
    action,
    issue,
    timestamp: new Date(),
    data: util.inspect(data),
  }
  console.log(theLog) // Console logging for pm2.
  Logs.findOneAndUpdate({ serverId: server }, { // Also store the log in DB.
    $push: { logs: theLog },
  }, { upsert: true }).catch(console.log)
}

module.exports = log
