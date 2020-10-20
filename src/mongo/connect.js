const mongoose = require('mongoose')
const secrets = require('../../secrets.json')

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
  }, { upsert: true }).catch((e) => console.log({ error: e, setting, value }))
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
    const update = { serverName: guild.serverName }
    const options = {
      upsert: true,
      setDefaultsOnInsert: true,
      useFindAndModify: false,
    }
    Servers.findOneAndUpdate(query, update, options)
  })
}

module.exports = {
  setSetting,
  getSettings,
  connect,
  setupGuilds,
}
