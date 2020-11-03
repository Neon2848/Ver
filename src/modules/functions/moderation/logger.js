const { MessageEmbed } = require('discord.js')

let logChannel = null
const getLogChannel = (guild) => {
  if (logChannel) return logChannel
  logChannel = guild.channels.cache.filter((r) => r.name === guild.giuseppeSettings.channelModLog)
  return logChannel.first()
}

const genUserDetails = (channelID, authorID) => [{ name: 'Sender', value: `<@${channelID}>`, inline: true }, { name: 'Channel', value: `<#${authorID}>`, inline: true }]
const getAttachments = (message) => message.attachments.map((a) => a.proxyURL).join('\n')
const genTextFields = (editDate, value, i) => {
  const edited = editDate ? 'Edited to:' : 'Content:'
  return { name: i === 0 ? edited : '\u200E', value }
}

const generateTextFields = (message, editDate = null) => {
  const { content, channel, author } = message
  const parts = content.match(/[\s\S]{1,1024}/g)
  if (parts.length) {
    const mapped = parts.map((value, i) => genTextFields(editDate, value, i))
    if (!editDate) mapped.unshift(...genUserDetails(channel.id, author.id))
    if (!editDate && message.attachments.size) mapped.push({ name: 'Attachments', value: getAttachments(message) })
    return mapped
  }
  return []
}

const logEditedMessage = (oldMessage, newMessage = null) => {
  const { guild, client, channel } = oldMessage

  const editedMessage = new MessageEmbed({
    color: newMessage ? 16695040 : 13441048,
    description: `https://discordapp.com/channels/${guild.id}/${channel.id}/${newMessage?.id || oldMessage.id}`,
    author: {
      name: `Message ${newMessage ? 'Edited' : 'Deleted'}`,
      icon_url: client.config.images.v3rmLogo,
    },
    footer: { text: 'Logged' },
    timestamp: newMessage?.editedTimestamp || Date.now(),
  })
  editedMessage.addFields(generateTextFields(oldMessage))
  if (newMessage) {
    editedMessage.addFields(generateTextFields(newMessage, newMessage.editedTimestamp))
  }
  getLogChannel(guild).send(editedMessage)
}

const logMessage = (client, message, newMessage = null) => {
  const { guild, channel } = message
  if (channel.parent.name === 'Esoterica' || channel === getLogChannel(guild)) return
  logEditedMessage(message, newMessage)
}

module.exports = { logMessage }
