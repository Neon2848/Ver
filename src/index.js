/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const Discord = require('discord.js')
const Enmap = require('enmap')
const fs = require('fs')
const mongo = require('./mongo/connect')
const secrets = require('../secrets.json')

const client = new Discord.Client()

client.secrets = secrets

fs.readdir('./src/modules/events/', (err, files) => {
  if (err) return mongo.log('global', 'error', 'readdir', 'reading events directory', err)
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
  if (err) return mongo.log('global', 'error', 'readdir', 'reading commands directory', err)
  files.forEach((file) => {
    if (!file.endsWith('.js')) return
    const props = require(`./modules/commands/${file}`)
    const commandName = file.split('.')[0]
    client.commands.set(commandName, props)
  })
  return files
})

client.login(secrets.discord.token)
