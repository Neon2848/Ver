const mongoose = require('mongoose')

const { Schema } = mongoose

const serversSchema = new Schema({
  serverId: String,
  serverName: String,
  settings: {
    lastLookup: { type: Date, default: Date.now },
    lookupTimeout: { type: Number, default: 30 },
    allowUsersToLookup: { type: Boolean, default: false },
    channelWelcome: { type: String, default: 'welcome' },
    channelDetoxChamber: { type: String, default: 'detox-chamber' },
    channelBotCommands: { type: String, default: 'bot-commands' },
    channelModLog: { type: String, default: 'channellog' },
    channelStaffVC: { type: String, default: 'Staff' },
  },
})

module.exports = serversSchema
