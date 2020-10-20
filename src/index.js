/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const Discord = require('discord.js')
const Enmap = require('enmap')
const fs = require('fs')
const log = require('./mongo/log')
const secrets = require('../secrets.json')
const config = require('../config.json')

const client = new Discord.Client()

client.secrets = secrets
client.config = config

fs.readdir('./src/modules/events/', (err, files) => {
  if (err) return log('global', 'error', 'readdir', 'reading events directory', err)
  files.forEach((file) => {
    if (!file.endsWith('.js')) return
    const event = require(`./modules/events/${file}`)
    const eventName = file.split('.')[0]
    client.on(eventName, event.bind(null, client))
    delete require.cache[require.resolve(`./modules/events/${file}`)]
  })
  return files
})

client.commands = new Enmap()
fs.readdir('./src/modules/commands/', (err, files) => {
  if (err) return log('global', 'error', 'readdir', 'reading commands directory', err)
  files.forEach((file) => {
    if (!file.endsWith('.js')) return
    if (file.startsWith('_') && !client.config.v3rmAPI) return
    const props = require(`./modules/commands/${file}`)
    const commandName = file.replace('_', '').split('.')[0]
    client.commands.set(commandName, props)
  })
  return files
})

client.login(secrets.discord.token)

// if you read this you are automatically cute
