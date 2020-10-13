const { sendResult, genSpinner, kickUser } = require('../functions')
const warn = require('../functions/warn')

const doWarn = async (discordid, reason, editable) => {
  const attemptWarn = await warn(discordid, reason).catch((e) => { sendResult(e.message, { message: editable, edit: true }, 'Unable to warn.') }).catch((e) => { throw e })
  if (!attemptWarn) return null

  if (attemptWarn.isBeingBanned) {
    const guildMember = editable.guild.members.cache.find((m) => m.id === discordid)
    if (guildMember) {
      kickUser(guildMember, editable, {
        dm: 'You have been kicked from the our server because you just received a site warning which took you to 100% warning level.',
        channel: `Kicked <@${discordid}>, who is at 100% warning level.`,
        log: 'User kicked for max warn level.',
      })
    }
  }
  return attemptWarn
}

const quoteRegex = (msg) => {
  const regParts = new RegExp(/([“"])(.+)(\1)/, 'gm').exec(msg)
  if (regParts) return regParts[2]
  return null
}

const buildError = (id, quote) => {
  let tmpError = ''
  if (!id) tmpError += 'You did not provide a valid user to warn'
  if (!quote) tmpError += `${id ? '.\n' : ''}You did not provide a valid warn reason`
  return tmpError
}

exports.run = async (client, message, args) => { // eslint-disable-line no-unused-vars
  if (!message.member.hasPermission('KICK_MEMBERS')) return

  const spinner = genSpinner('Attempting to warn...')
  const editable = await message.channel.send(spinner)
  const id = args.argMap.users[0] || null
  const justQuote = quoteRegex(message.cleanContent)

  if (buildError(id, justQuote).length) {
    sendResult(buildError, { message: editable, edit: true }, 'Unable to warn.')
    return
  }

  const warned = await doWarn(id, justQuote[2], editable)
  if (warned) sendResult(`<@${id}> has been warned for: \`${justQuote[2]}\``, { message: editable, edit: true }, 'User warned')
}
