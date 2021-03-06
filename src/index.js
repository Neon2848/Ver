/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const Discord = require('discord.js')
const Enmap = require('enmap')
const fs = require('fs')
const recursive = require('recursive-readdir')
const path = require('path')
const log = require('./mongo/log')
const secrets = require('../secrets.json')
const config = require('../config.json')
const { getWordlistAsRegex } = require('./modules/functions/moderation')

const client = new Discord.Client({ partials: ['REACTION', 'MESSAGE'] })

client.secrets = secrets
client.config = config

// This maps the filters to a more dynamic regex.
// I could just store the regex directly but it's less intuitive.
const { config: { characterEvasionMap } } = client
const { secrets: { wordFilters } } = client

client.secrets.regexFilters = Object.values(wordFilters)
  .map((filter) => getWordlistAsRegex(filter, characterEvasionMap))

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
recursive('./src/modules/commands', (err, files) => {
  if (err) return log('global', 'error', 'readdir', 'reading commands directory', err)
  files.forEach((file) => {
    const dirParts = path.dirname(file).replace(/\\/g, '/').split('/')
    dirParts.shift() // Remove src/ from directory parts
    const fileName = path.basename(file)

    const props = require(path.join(__dirname, [...dirParts].join('/'), fileName)) // rebuild path
    // set permission based on permisisons folder (./kick_members, etc)
    props.permissionLevel = dirParts[dirParts.length - 1].toUpperCase()
    const commandName = fileName.split('.')[0]
    client.commands.set(commandName, props)
  })
  return files
})

client.login(secrets.discord.token)

// if you read this you are automatically cute
