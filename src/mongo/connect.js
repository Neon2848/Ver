const mongoose = require('mongoose')
const secrets = require('../../secrets.json')
const log = require('./log')

const serversSchema = require('./schemas/servers.js')

const Servers = mongoose.model('Servers', serversSchema)

const connect = () => {
  mongoose.connect(secrets.mongo.server, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
}

const setSetting = (server, setting, value) => {
  Servers.updateOne({ serverId: server }, {
    $set: {
      settings: {
        [setting]: value,
      },
    },
  }, { upsert: true }).catch((e) => log(server, 'error', 'setting a setting', e.message, { setting, value }))
}

const getSettings = (server) => new Promise((resolve, reject) => {
  Servers.findOne({ serverId: server }, (err, resp) => {
    if (err) reject(err)
    resolve(resp.settings)
  })
})

const setupGuilds = (guilds) => {
  guilds.forEach((guild) => {
    const query = { serverId: guild.serverId }
    const update = {
      $set: {
        serverName: guild.serverName,
      },
    }
    const options = { upsert: true, new: true, setDefaultsOnInsert: true, useFindAndModify: false }
    Servers.findOneAndUpdate(query, update, options, ((err, succ) => {
      if (err) log(guild.serverId, 'error', 'setting up a guild', err.message, guild)
      return succ
    }))
  })
}

module.exports = {
  setSetting,
  getSettings,
  connect,
  setupGuilds,
}
