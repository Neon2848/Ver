const mongoose = require('mongoose')

const { Schema } = mongoose

const serversSchema = new Schema({
  serverId: String,
  serverName: String,
  settings: {
    lastLookup: { type: Date, default: Date.now },
    lookupTimeout: { type: Number, default: 30 },
    allowUsersToLookup: { type: Boolean, default: false },
  },
  channels: {
    staffVC: { type: String, default: 'Staff' },
    welcome: { type: String, default: 'welcome' },
    detoxChamber: { type: String, default: 'detox-chamber' },
    botCommands: { type: String, default: 'bot-commands' },
    modLog: { type: String, default: 'channel-log' },
    slurLog: { type: String, default: 'swore-log' },
  },
  roles: {
    muted: { type: String, default: 'votemuted' },
    toxic: { type: String, default: 'toxic' },
  },
})

module.exports = serversSchema
