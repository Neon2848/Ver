const { inCacheUpsert } = require('../general')

// This is heavy, and should only be called at bot start,
// the resulting regex can be set as client.config
const getWordlistAsRegex = (wordlist, wordFilter) => {
  const regexBlacklist = []
  wordlist.forEach((badWord) => {
    const alreadyRegex = badWord.match(/\/(.*)\//)
    if (alreadyRegex && alreadyRegex.length) regexBlacklist.push(alreadyRegex[1])
    else {
      const characterArray = Array.from(badWord).map((char) => {
        if (Object.keys(wordFilter).includes(char)) return `[${char}${wordFilter[char]}]+`
        return `${char}+`
      })
      regexBlacklist.push(characterArray.join(''))
    }
  })
  return new RegExp(`(${regexBlacklist.join(')|(')})`, 'mi')
}

const genNotice = {
  exploit: (theword, iconUrl) => ({
    embed: {
      description: `Hey there, I just deleted a message of yours because I detected the word: \`${theword}\`.\n
Unfortunately you're not allowed to talk about exploiting here. \
Discord's rules are pretty strict, and we want to make sure we're following them properly or they'll delete our server. \
Make sure to read the welcome channel. Your discussion might be better placed as a thread or post on the forum itself.`,
      color: 13441048,
      author: { name: 'Discord TOS Violation.', icon_url: iconUrl },
    },
  }),
  sensitive: (theword, iconUrl) => ({
    embed: {
      description: `Hey there, I just deleted a message of yours because I detected the word: \`${theword}\`.\n
We filter some sensitive words to encourage you think about what you're saying, not be overly sexual, and not make light of serious topics.\n
For the next 20 minutes, I'll ignore sensitive words from you (not slurs though). Please make sure you use this privilege maturely and in a healthy way \
or we might have to warn you.`,
      color: 13441048,
      author: { name: 'Sensitive word detected.', icon_url: iconUrl },
    },
  }),
  slur: (message, iconUrl) => ({
    embed: {
      description: message.cleanContent,
      color: 13441048,
      fields: [
        {
          name: 'Sent By',
          value: `<@${message.author.id}>`,
          inline: true,
        },
        {
          name: 'In',
          value: `<#${message.channel.id}>`,
          inline: true,
        },
      ],
      footer: {
        text: 'React below to warn for 2M, 2O, or ignore respestively.',
      },
      author: {
        name: 'Slur Detected',
        icon_url: iconUrl,
      },
    },
  }),
}

const cacheCheckFunction = (message, filter, type) => {
  const match = message.cleanContent.match(filter)
  if (!match) return { cached: false, word: null }
  if (!inCacheUpsert(type, message, 1200)) return { cached: false, word: match[0] }
  return { cached: true, word: match[0] }
}

const checkFunctions = {
  slur: (message, filter, type, v3rmLogo) => {
    const isASlur = filter.test(message.cleanContent)
    if (!isASlur) return false
    const swearLogsChannel = message.guild.channels.cache
      .find(((c) => c.name === message.guild.giuseppeSettings.channelSlurLog))

    swearLogsChannel.send(genNotice[type](message, v3rmLogo)).then((sent) => {
      sent.react('🇲').then(() => sent.react('🇱').then(() => sent.react('❌')))
    })

    return true
  },

  // Delete, but don't send the message, if the user is in the safe cache.
  exploit: (message, filter, type, v3rmLogo) => {
    const { cached, word } = cacheCheckFunction(message, filter, type)
    if (!word) return false
    if (!cached) message.member.send(genNotice[type](word, v3rmLogo)).catch(() => {})
    return true
  },

  // Don't delete or send the message if the user is in the safe cache.
  sensitive: (message, filter, type, v3rmLogo) => {
    const { cached, word } = cacheCheckFunction(message, filter, type)
    if (!word || cached) return false
    message.member.send(genNotice[type](word, v3rmLogo)).catch(() => {})
    return true
  },

  other: (message, filter) => filter.test(message.cleanContent),
}

const checkWordFilters = (client, message) => {
  const { secrets } = client
  const { config: { images: { v3rmLogo } } } = client
  const keys = Object.keys(secrets.wordFilters)
  const needsDeleting = secrets.regexFilters
    .some((filter, index) => checkFunctions[keys[index]](message, filter, keys[index], v3rmLogo))
  if (needsDeleting) message.delete().catch(() => {})
}

module.exports = { checkWordFilters, getWordlistAsRegex }
