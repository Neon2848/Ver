const { inCacheUpsert, safeDelete } = require('../general')

// This is heavy, and should only be called at bot start,
// the resulting regex can be set as client.config
const getWordlistAsRegex = (wordlist, wordFilter) => {
  const regexDenylist = []
  wordlist.forEach((badWord) => {
    const alreadyRegex = badWord.match(/\/(.*)\//)
    if (alreadyRegex && alreadyRegex.length) regexDenylist.push(alreadyRegex[1])
    else {
      const characterArray = Array.from(badWord).map((char) => {
        if (Object.keys(wordFilter).includes(char)) return `[${char}${wordFilter[char]}]+`
        return `${char.replace(/\./, '\\.')}+`
      })
      regexDenylist.push(characterArray.join(''))
    }
  })
  return new RegExp(`(${regexDenylist.join(')|(')})`, 'mi')
}

const genEmbed = (description, theword, iconUrl) => ({
  embed: {
    description,
    color: 13441048,
    author: { name: 'Message Deleted', icon_url: iconUrl },
  },
})

const genNotice = {
  exploit: (theword, ...args) => genEmbed(`Hey there, I just deleted a message of yours because I detected the word: ||\`${theword}\`||.\n
Unfortunately you're not allowed to talk about exploiting here. \
Discord's rules are pretty strict, and we want to make sure we're following them properly or they'll delete our server. \
Make sure to read the welcome channel. Your discussion might be better placed as a thread or post on the forum itself.`, ...args),

  sensitive: (tw, ...args) => genEmbed(`Hey there, I just deleted a message of yours because I detected the word: \`${tw}\`.\n
We filter some sensitive words to encourage you think about what you're saying, not be overly sexual, and not make light of serious topics.\n
For the next 20 minutes, I'll ignore sensitive words from you (not slurs though). Please make sure you use this privilege maturely and in a healthy way \
or we might have to warn you.`, ...args),

  slur: (wordArr, message, iconUrl) => ({
    embed: {
      description: wordArr.input.replace(wordArr[0], `${wordArr[0][0]}||${wordArr[0].substring(1)}||`),
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
    const isASlur = message.cleanContent.match(filter) || []
    if (!isASlur.length) return false
    message.guild.channels.cache.get(message.guild.giuseppe.channels.slurLog)
      .send(genNotice[type](isASlur, message, v3rmLogo)).then((sent) => {
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
  if (!message.member || message.member.hasPermission('KICK_MEMBERS')) return
  const { secrets } = client
  const { config: { images: { v3rmLogo } } } = client
  const keys = Object.keys(secrets.wordFilters)
  const needsDeleting = secrets.regexFilters
    .some((filter, index) => checkFunctions[keys[index]](message, filter, keys[index], v3rmLogo))
  if (needsDeleting) safeDelete(message, 0)
}

module.exports = { checkWordFilters, getWordlistAsRegex }
