const Discord = require('discord.js') // eslint-disable-line no-unused-vars
const { recreateEmoji } = require('../functions/general')

module.exports = (client, oldEmoji) => recreateEmoji(oldEmoji.name, oldEmoji.guild)
