const { MessageEmbed } = require('discord.js')
const Diff = require('diff')

const genUserDetails = (channelID, authorID) => [{ name: 'Sender', value: `<@${authorID}>`, inline: true }, { name: 'Channel', value: `<#${channelID}>`, inline: true }]
const getAttachments = (message) => message.attachments.map((a) => a.proxyURL || a.url || a.attachment).join('\n')
const getEmbeds = (message) => message.embeds.map((e) => e.video?.proxyURL || e.image?.proxyURL || e.thumbnail?.proxyURL).filter((truthy) => !!truthy).join('\n')

const genTextFields = (value, i) => {
  const edited = 'Content'
  return { name: i === 0 ? edited : '\u200E', value }
}

const generateAdditionalFields = (message, existingFields) => {
  if (message.attachments.size) existingFields.push({ name: 'Attachments', value: getAttachments(message) })
  if (message.embeds.length) existingFields.push({ name: 'Embeds', value: getEmbeds(message) })
  existingFields.unshift(...genUserDetails(message.channel.id, message.author.id))
  return existingFields
}

const generateTextFields = (message, customcContent = null) => {
  const { content } = customcContent || message
  const parts = content.match(/[\s\S]{1,1024}/g) || []
  if (parts.length || message.attachments.size) {
    const mapped = parts.map((value, i) => genTextFields(value, i))
    return generateAdditionalFields(message, mapped)
  }
  return []
}

const getDiff = (oldm, newm) => Diff.diffWords(oldm.cleanContent, newm.cleanContent).map((c) => {
  const cleanVal = c.value.replace(/\*/g, '∗').replace(/~/gm, '∽')
  if (c.added) return `**${cleanVal}**`
  if (c.removed) return `~~${cleanVal}~~`
  return cleanVal
}).join('')

const logEditedMessage = (logToChannel, oldMessage, extraInfo, newMessage = null) => {
  const { guild, client, channel } = oldMessage
  // if (!newMessage && !oldMessage.cleanContent.length) console.log(oldMessage)

  const editedMessage = new MessageEmbed({
    color: newMessage ? 16695040 : 13441048,
    description: `${extraInfo ? `${extraInfo}\n\n` : ''}https://discordapp.com/channels/${guild.id}/${channel.id}/${newMessage?.id || oldMessage.id}`,
    author: {
      name: `Message ${newMessage ? 'Edited' : 'Deleted'}`,
      icon_url: client.config.images.v3rmLogo,
    },
    footer: { text: 'Logged' },
    timestamp: newMessage?.editedTimestamp || Date.now(),
  })

  if (newMessage) {
    editedMessage.addFields(
      generateTextFields(newMessage, { content: getDiff(oldMessage, newMessage) }),
    )
  } else editedMessage.addFields(generateTextFields(oldMessage))

  return editedMessage
}

const logMessage = async (logToChannel, message, extraInfo = null, newMessage = null) => {
  const { channel, guild } = message
  if (channel.parent?.name === 'Esoterica') return null
  const toLog = logEditedMessage(logToChannel, message, extraInfo, newMessage)
  const theChannel = guild.channels.cache.get(logToChannel)
  const logged = await theChannel.send(toLog)
  return logged
}

module.exports = { logMessage }
