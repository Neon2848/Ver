const mongoose = require('mongoose')

const { Schema } = mongoose

const serversSchema = new Schema({
  serverId: String,
  serverName: String,
  settings: {
    lastLookup: { type: Date, default: Date.now },
    lookupTimeout: { type: Number, default: 30 },
    allowUsersToLookup: { type: Boolean, default: true },
  },
  channels: {
    staffVC: { type: String, default: 'Staff' },
    welcome: { type: String, default: 'welcome' },
    detoxChamber: { type: String, default: 'detox-chamber' },
    botCommands: { type: String, default: 'bot-commands' },
    modLog: { type: String, default: 'channel-log' },
    slurLog: { type: String, default: 'swore-log' },
    voteApprovals: { type: String, default: 'vote-abuse-approvals' },
    activationLog: { type: String, default: 'watch-people-join' },
  },
  roles: {
    muted: { type: String, default: 'votemuted' },
    toxic: { type: String, default: 'toxic' },
    member: { type: String, default: 'Member' },
    nitro: { type: String, default: 'cute people' },
    leaderboardLord: { type: String, default: 'Leaderboard Lord' },
    esoterica: { type: String, default: 'Esoterica' },
    chuu: { type: String, default: 'Chuu.fm' },
    furry: { type: String, default: 'furry' },
  },
})

module.exports = serversSchema
