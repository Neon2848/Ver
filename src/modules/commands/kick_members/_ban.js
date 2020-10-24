const ban = require('../../functions/api/ban')
const {
  genSpinner, buildModerationError, quoteRegex, sendResult, kickUser,
} = require('../../functions')

const msToDays = (date) => (date ? Math.round((date - Date.now()) / (24 * 60 * 60 * 1000)) : null)

const findAndKickMember = async (discordid, reason, days, editable, newban = true) => {
  const guildMember = editable.guild.members.cache.find((m) => m.id === discordid)
  if (!guildMember) return sendResult(`The user ${(newban ? 'has now been' : 'is already')} banned, and they're not in the server`, { message: editable, edit: true }, 'Unable to kick.')
  if (newban) {
    return kickUser(guildMember, editable, {
      dm: `You have been kicked because you have been banned on site for: \`${reason}\`. You can rejoin when your site ban expires, in \`${days}\` days.`,
      channel: `Banned <@${discordid}> for \`${days}\` days for: \`${reason}\``,
      log: `Ban command: ${reason}`,
    })
  }
  return kickUser(guildMember, editable, {
    dm: 'You have been kicked because you are already banned onsite.',
    channel: 'User was already banned, and has now been kicked',
    log: 'Kicking already-banned user',
  })
}

const doBan = async (discordid, reason, days, editable) => {
  const attemptBan = await ban(discordid, reason, days).catch((e) => {
    if (e.message === 'User already banned') return findAndKickMember(discordid, reason, days, editable, false)
    return sendResult(e.message, { message: editable, edit: true }, 'Unable to ban.')
  })
  if (!attemptBan) return null

  await findAndKickMember(discordid, reason, days, editable)
  return attemptBan
}

const chooseBanDays = (args) => {
  let ret = null
  if (args.argMap.timeArgs?.[0]) ret = msToDays(args.argMap.timeArgs[0])
  else ret = args.argMap.numbers?.[0] || null
  return ret > 0 ? ret : null
}

// eslint-disable-next-line no-unused-vars
exports.run = async (client, message, args, externalQuote = null) => {
  const spinner = genSpinner('Attempting to ban...')
  const editable = await message.channel.send(spinner)
  const id = args.argMap.users[0] || null
  const banDays = chooseBanDays(args)

  const justQuote = quoteRegex(externalQuote ? `"${externalQuote}"` : message.cleanContent)
  const bError = buildModerationError(id, justQuote, banDays, true)

  if (bError.length) return sendResult(bError, { message: editable, edit: true }, 'Unable to ban.')

  await doBan(id, justQuote, banDays, editable)
  return null
}
