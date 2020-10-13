const {
  sendResult, genSpinner, kickUser, buildModerationError, quoteRegex,
} = require('../functions')
const warn = require('../functions/api/warn')

const warnFailedIntercept = async (e, message, reason) => {
  if (e.message !== 'This user is already at 100% warning level') return false
  await sendResult(`This user is currently at 100% warning level. React below to ban them for \`3\` or \`7\` days for the same reason, or react with \`x\` to cancel.\
  (Generally aim for 3 days unless they have been banned recently or the offence is more significant).\n\n\
  \`\`\`Reason: ${reason}\`\`\`\nFeel free to \`!ban\` manually instead`, { message, edit: true }, 'Unable to warn.')
  message.react('3️⃣').then(message.react('7️⃣').then(message.react('❌')))
  return true
}

const catchWarnError = async (e, message, reason) => {
  const interceptedWarn = await warnFailedIntercept(e, message, reason)
  if (!interceptedWarn) sendResult(e.message, { message, edit: true }, 'Unable to warn.')
}

const doWarn = async (discordid, reason, editable) => {
  const attemptWarn = await warn(discordid, reason).catch((e) => catchWarnError(e, editable))
  if (!attemptWarn) return null

  if (attemptWarn.isBeingBanned) {
    const guildMember = editable.guild.members.cache.find((m) => m.id === discordid)
    if (guildMember) {
      kickUser(guildMember, editable, {
        dm: `You have been kicked because you just received a site warning: \`${reason}\`, and are now at max warning level.`,
        channel: `Kicked <@${discordid}>, who is at 100% warning level.`,
        log: `Max warning level: ${reason}`,
      })
    }
  }
  return attemptWarn
}
exports.run = async (client, message, args) => { // eslint-disable-line no-unused-vars
  if (!message.member.hasPermission('KICK_MEMBERS')) return

  const spinner = genSpinner('Attempting to warn...')
  const editable = await message.channel.send(spinner)
  const id = args.argMap.users[0] || null
  const justQuote = quoteRegex(message.cleanContent)
  const bError = buildModerationError(id, justQuote)

  if (bError.length) {
    sendResult(bError, { message: editable, edit: true }, 'Unable to warn.')
    return
  }

  const warned = await doWarn(id, justQuote, editable)
  if (warned) sendResult(`<@${id}> has been warned for: \`${justQuote}\``, { message: editable, edit: true }, 'User warned')
}
