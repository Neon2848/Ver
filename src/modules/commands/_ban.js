const ban = require('../functions/api/ban')
const {
  genSpinner, buildModerationError, quoteRegex, sendResult, kickUser,
} = require('../functions')

const msToDays = (date) => (date ? Math.round((date - Date.now()) / (24 * 60 * 60 * 1000)) : null)

const doBan = async (discordid, reason, days, editable) => {
  const attemptBan = await ban(discordid, reason, days).catch((e) => sendResult(e.message, { message: editable, edit: true }, 'Unable to ban.'))
  if (!attemptBan) return null

  const guildMember = editable.guild.members.cache.find((m) => m.id === discordid)
  if (guildMember) {
    kickUser(guildMember, editable, {
      dm: `You have been kicked because you have been banned on site for: \`${reason}\`. You can rejoin when your site ban expires, in \`${days}\` days.`,
      channel: `Banned <@${discordid}> for \`${days}\` days for: \`${reason}\``,
      log: `Ban command: ${reason}`,
    })
  }
  return attemptBan
}
// eslint-disable-next-line no-unused-vars
exports.run = async (client, message, args, externalQuote = null) => {
  if (!message.member.hasPermission('KICK_MEMBERS')) return null

  const spinner = genSpinner('Attempting to ban...')
  const editable = await message.channel.send(spinner)
  const id = args.argMap.users[0] || null
  const banMS = args.argMap.timeArgs?.[0] || null
  const banDays = msToDays(banMS)
  const chooseBanDays = banDays || args.argMap.numbers[0] || null
  const justQuote = quoteRegex(externalQuote ? `"${externalQuote}"` : message.cleanContent)
  const bError = buildModerationError(id, justQuote, chooseBanDays > 0 ? chooseBanDays : null, true)

  if (bError.length) return sendResult(bError, { message: editable, edit: true }, 'Unable to ban.')

  await doBan(id, justQuote, chooseBanDays, editable)
  return null
}
