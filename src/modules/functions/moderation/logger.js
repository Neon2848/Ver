const { MessageEmbed } = require('discord.js')

let logChannel = null
const getLogChannel = (guild) => {
  if (logChannel) return logChannel
  const lc = guild.channels.cache.filter((r) => r.name === guild.giuseppeSettings.channelModLog)
  logChannel = lc.first()
  return logChannel
}

const genUserDetails = (channelID, authorID) => [{ name: 'Sender', value: `<@${authorID}>`, inline: true }, { name: 'Channel', value: `<#${channelID}>`, inline: true }]
const getAttachments = (message) => message.attachments.map((a) => a.proxyURL).join('\n')

const genTextFields = (editDate, value, i) => {
  const edited = editDate ? 'Edited to:' : 'Content:'
  return { name: i === 0 ? edited : '\u200E', value }
}

const generateAdditionalFields = (message, existingFields) => {
  if (message.attachments.size) existingFields.push({ name: 'Attachments', value: getAttachments(message) })
  existingFields.unshift(...genUserDetails(message.channel.id, message.author.id))
  return existingFields
}

const generateTextFields = (message, editDate = null) => {
  const { content } = message
  const parts = content.match(/[\s\S]{1,1024}/g)
  if (parts.length) {
    const mapped = parts.map((value, i) => genTextFields(editDate, value, i))
    return editDate ? mapped : generateAdditionalFields(message, mapped)
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
