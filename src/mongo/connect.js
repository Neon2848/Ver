const mongoose = require('mongoose')
const secrets = require('../../secrets.json')
const log = require('./log')
const serversSchema = require('./schemas/servers.js')

mongoose.set('useNewUrlParser', true)
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)

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

const getSettings = async (server) => {
  const { settings } = await Servers.findOne({ serverId: server }).catch((e) => { throw e })
  return settings
}

const setupOneGuild = async (guild) => {
  const query = { serverId: guild.serverId }
  const update = {
    $set: {
      serverName: guild.serverName,
    },
  }
  const options = {
    upsert: true, new: true, setDefaultsOnInsert: true,
  }
  const updated = await Servers.findOneAndUpdate(query, update, options).catch((err) => log(guild.serverId, 'error', 'setting up a guild', err.message, guild))
  return updated
}

module.exports = {
  setSetting,
  getSettings,
  connect,
  setupOneGuild,
}
