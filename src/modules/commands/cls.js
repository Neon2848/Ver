const { genSpinner, sendResult } = require('../functions')

const maxChunk = 100

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

  const deletedMessages = await pendingMsg.channel.bulkDelete(filteredMessages, true)
  return deletedMessages.size
}

exports.run = async (client, message, args) => { // eslint-disable-line no-unused-vars
  const pendingMsg = await message.channel.send(genSpinner('Deleting messages from this channel.'))
  const aFilters = args.argMap
  const numToClear = aFilters.numbers[0] ? parseInt(aFilters.numbers[0], 10) : 99
  const { filters, tooManyArgs, regexError } = genFilters(aFilters, args.raw.length)

  if (regexError) {
    return sendResult(
      `Your regular expression was invalid: \n\n**${regexError.name}:**\n\`${regexError.message}\``,
      { message: pendingMsg, edit: true, timeout: 30000 },
      'Regex Error',
    )
  }

  if (tooManyArgs) {
    /* eslint-disable no-useless-escape */
    return sendResult(
      'There was an issue with one of your arguments. Here are some examples:\ ```js\n\
!cls 500 @FromUser "badword1" "badWord2" \`/regex1/\` \`/regex2/\`\n!cls 5\n!cls @FromUser\n!cls "badword"\n!cls has:embed has:attachment```\n\
      Deletes messages matching all filters. All filters are optional, and the number defaults to 99. Multiple `"hasWord"` and ``/matchesRegex/`` are allowed',
      { message: pendingMsg, edit: true, timeout: 30000 },
      'Format Issue',
    )
    /* eslint-enable no-useless-escape */
  }

  if (numToClear < maxChunk) {
    const deletedMessages = await deleteMessages(pendingMsg, numToClear + 1, filters)
    return sendResult(`Successfully deleted \`${deletedMessages}\` from this channel`, { message: pendingMsg, edit: true }, 'Messages Deleted')
  }
  let successes = 0
  let remaining = numToClear
  while (remaining > 0) {
    remaining += 1 // Add 1 each iteration for the pending message.
    const thisChunk = Math.min(maxChunk, remaining)
    // needed below, I spent 2 hours trying to do this recursively.
    // eslint-disable-next-line no-await-in-loop
    const deletedMessages = await deleteMessages(pendingMsg, thisChunk, filters)
    successes += deletedMessages
    remaining -= thisChunk
    pendingMsg.edit(genSpinner(`Fetched ${(numToClear - remaining)} of ${numToClear} messages. Successfully deleted ${successes}.`))
  }
  return sendResult(`Successfully deleted \`${successes}\` from this channel`, { message: pendingMsg, edit: true }, 'Messages Deleted')
}
