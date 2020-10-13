const { sendResult, genSpinner, kickUser } = require('../functions')
const warn = require('../functions/warn')

const warnFailedIntercept = async (e, message, reason) => {
  if (e.message !== 'This user is already at 100% warning level') return false
  await sendResult(`This user is currently at 100% warning level. React below to ban them for \`3\` or \`7\` days for the same reason, or react with \`x\` to cancel.\
  (Generally aim for 3 days unless they have been banned recently or the offence is more significant).\n\n\
  \`\`\`Reason: ${reason}\`\`\`\nFeel free to \`!ban\` manually instead`, { message, edit: true }, 'Unable to warn.')
  message.react('3️⃣').then(message.react('7️⃣').then(message.react('❌')))
  return true
}

const catchWarnError = (e, message, reason) => {
  const interceptedWarn = warnFailedIntercept(e, message, reason)
  if (!interceptedWarn) sendResult(e.message, { message, edit: true }, 'Unable to warn.')
}

const doWarn = async (discordid, reason, editable) => {
  const attemptWarn = await warn(discordid, reason).catch((e) => catchWarnError(e))
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
  if (!quote) tmpError += `${!id ? '.\n' : ''}You did not provide a valid warn reason`
  return tmpError
}

exports.run = async (client, message, args) => { // eslint-disable-line no-unused-vars
  if (!message.member.hasPermission('KICK_MEMBERS')) return

  const spinner = genSpinner('Attempting to warn...')
  const editable = await message.channel.send(spinner)
  const id = args.argMap.users[0] || null
  const justQuote = quoteRegex(message.cleanContent)
  const bError = buildError(id, justQuote)

  if (buildError(id, justQuote).length) {
    sendResult(bError, { message: editable, edit: true }, 'Unable to warn.')
    return
  }

  const warned = await doWarn(id, justQuote, editable)
  if (warned) sendResult(`<@${id}> has been warned for: \`${justQuote}\``, { message: editable, edit: true }, 'User warned')
}
