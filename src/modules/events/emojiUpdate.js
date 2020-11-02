const Discord = require('discord.js') // eslint-disable-line no-unused-vars
const { recreateEmoji } = require('../functions/general')

module.exports = (client, oldEmoji) => {
  const copyName = oldEmoji.name
  const copyGuild = oldEmoji.guild
  if (oldEmoji.name === 'raysA' || oldEmoji.name === 'spray' || oldEmoji.name === 'raysS') {
    oldEmoji.setName(oldEmoji.name).catch(recreateEmoji(copyName, copyGuild))
  }
}
