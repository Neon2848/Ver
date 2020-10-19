const { genSpinner, sendResult } = require('../functions')
const knownErrors = require('../knownErrors')

const maxChunk = 100

// eslint-disable-next-line max-lines-per-function
const genFilters = (aFilters, argsLength) => {
  const ffs = []

  // Filters for `/regex/`
  let regexError = null
  aFilters.regexs.forEach((r) => {
    if (r instanceof Error) regexError = r
    else ffs.push((_) => r.test(_.content))
  })
  if (regexError) return { filters: null, tooManyArgs: null, regexError }

  // Filters for first @User
  aFilters.users.some((id) => {
    ffs.push((_) => _.member.id === id)
    return true
  })

  // Filters for "words"
  aFilters.inQuotes.forEach((word) => ffs.push((_) => _.content.split(' ').includes(word)))

  // Filters for has:file/embed/image/sound/video
  aFilters.hasArgs.forEach((has) => ffs.push((_) => {
    if (has === 'embed') return !!_.embeds
    if (has === 'file') return !!_.attachments

    const proxyURL = _.embeds[0]?.thumbnail?.proxyURL || _.attachments.first()?.proxyURL || ''
    return has.test(proxyURL)
  }))

  let totalMatchingArgs = 0
  Object.values(aFilters).forEach((v) => { totalMatchingArgs += v.length })
  return { filters: ffs, tooManyArgs: argsLength > totalMatchingArgs, regexError: null }
}

const deleteMessages = async (pendingMsg, numToCrawl, filt) => {
  const allMessages = await pendingMsg.channel.messages.fetch({ limit: numToCrawl })
  let filteredMessages = allMessages.filter((f) => f !== pendingMsg)

  filt.forEach((filter) => {
    filteredMessages = filteredMessages.filter(filter)
  })

  const deletedMessages = await pendingMsg.channel.bulkDelete(filteredMessages, true).catch((e) => knownErrors(pendingMsg.channel, e, 'bulk deleting'))
  return deletedMessages.size || 0
}

const sendUserErrors = (message, errorDetails = null) => {
  if (errorDetails !== null) {
    return sendResult(
      `Your regular expression was invalid: \n\n**${errorDetails.name}:**\n\`${errorDetails.message}\``,
      { message, edit: true, timeout: 30000 },
      'Regex Error',
    )
  }
  /* eslint-disable no-useless-escape */
  return sendResult(
    'There was an issue with one of your arguments. Here are some examples:\ ```js\n\
!cls 500 @FromUser "badword1" "badWord2" \`/regex1/\` \`/regex2/\`\n!cls 5\n!cls @FromUser\n!cls "badword"\n!cls has:embed has:attachment```\n\
    Deletes messages matching all filters. All filters are optional, and the number defaults to 99. Multiple `"hasWord"` and ``/matchesRegex/`` are allowed',
    { message, edit: true, timeout: 30000 },
    'Format Issue',
  )
  /* eslint-enable no-useless-escape */
}

const clsLoop = async (start, pendingMsg, filters, numToClear) => {
  let successes = 0
  let remaining = start
  while (remaining > 1) {
    remaining += 1 // Add 1 each iteration for the pending message.
    const thisChunk = Math.min(maxChunk, remaining)
    // eslint-disable-next-line no-await-in-loop
    const deletedMessages = await deleteMessages(pendingMsg, thisChunk, filters)
    successes += deletedMessages
    remaining -= thisChunk
    pendingMsg.edit(genSpinner(`Fetched ${(numToClear - remaining)} of ${numToClear} messages. Successfully deleted ${successes}.`))
  }
  return sendResult(`Successfully deleted \`${(successes + 1)}\` messages from this channel`, { message: pendingMsg, edit: true }, 'Messages Deleted')
}

exports.run = async (client, message, args) => { // eslint-disable-line no-unused-vars
  if (!message.member.hasPermission('KICK_MEMBERS')) return null

  const pendingMsg = await message.channel.send(genSpinner('Deleting messages from this channel.'))
  const aFilters = args.argMap
  const numToClear = aFilters.numbers[0] ? parseInt(aFilters.numbers[0], 10) : 99
  const { filters, tooManyArgs, regexError } = genFilters(aFilters, args.raw.length)

  if (tooManyArgs || regexError) return sendUserErrors(pendingMsg, regexError)
  if (numToClear < maxChunk) {
    const deletedMessages = await deleteMessages(pendingMsg, numToClear + 1, filters)
    return sendResult(`Successfully deleted \`${deletedMessages}\` messages from this channel`, { message: pendingMsg, edit: true }, 'Messages Deleted')
  }

  const loop = await clsLoop(numToClear + 1, pendingMsg, filters, numToClear)
  return loop
}
