const config = require('../../../config.json')
const knownErrors = require('../knownErrors')
const lookup = require('./api/lookup')
const secrets = require('../../../secrets.json')

const errorReasonTransform = (err) => {
  if (err === 'Input malformed') return 'There was an issue with your input. Please use `!lookup @User` or `!lookup id`.'
  if (err === 'User does not exist') return 'This user is not currently linked.'
  return `${err.replace(`${secrets.v3rm.api.base}`, 'apibase')}.`
}

const unsafeDelete = (msg, t) => {
  msg.delete({ timeout: t }).catch(() => {
    // swallow error, message may have already been deleted. doesn't matter.
  })
}

const sendResult = (resultMsg, caller, resultTitle) => {
  const emb = {
    embed: {
      description: errorReasonTransform(resultMsg),
      color: 13441048,
      author: { name: resultTitle, icon_url: config.images.v3rmLogo },
    },
  }
  const send = caller.edit ? caller.message.edit(emb) : caller.message.channel.send(emb)
  send.then((_) => {
    if (caller.timeout) {
      if (caller.edit) return unsafeDelete(caller.message, caller.timeout)
      return unsafeDelete(_, caller.timeout)
    }
    return true
  })
}

const kickUser = (member, editable, reasons) => {
  member.send(reasons.dm).finally(() => {
    sendResult(reasons.channel, { message: editable, edit: true }, 'Kicking User')
    member.kick(reasons.log).catch((e) => sendResult(`Unable to kick user: \`${e}\``, { message: editable, timeout: 10000 }, 'Kick Error'))
  })
}

const basicKickUser = (member, reason, gid) => {
  member.send(reason).finally(() => {
    member.kick('User does not have permissions on site').catch((_) => knownErrors.userOperation(_, gid))
  })
}

const genSpinner = (spinnerInfo) => (
  { embed: { color: 16674701, author: { name: spinnerInfo, icon_url: config.images.loader } } }
)

const basicUserSetup = async (details, member) => {
  const rolesToAdd = details.roles.map((role) => member.guild.roles.cache.find((guildRole) => guildRole.name === role && guildRole.name !== 'Member')).filter((r) => !!r)
  await member.setNickname(member.user.username === details.username ? `${member.user.username}\u200E` : details.username).catch((e) => { throw e })
  if (rolesToAdd.length) await member.roles.add(rolesToAdd).catch((e) => { throw e })
  return member
}

const basicLookup = async (member) => {
  const details = await lookup(member.id, member.guild.id, { bypass: true, type: 'basicLookup' }).catch(() => {})
  if (!details) return basicKickUser(member, 'There was an issue connecting your account to our website. Please double check that you are linked on https://v3rm.net/discord.', member.guild.id)
  if (details.roles.includes('Banned') || !details.roles.length) {
    return basicKickUser(member, 'Your site account is either banned or unactivated. Once this is resolved, you will be allowed to join our server.', member.guild.id)
  }
  return basicUserSetup(details, member)
}

const quoteRegex = (msg) => {
  const regParts = new RegExp(/([“"])(.+)(\1)/, 'gm').exec(msg)
  if (regParts) return regParts[2].replace(/`/gm, '')
  return null
}

const buildModerationError = (id, quote, length = null, lengthNeeded = false) => {
  let tmpError = ''
  if (!id) tmpError += 'You did not provide a valid user'
  if (!quote) tmpError += '\nYou did not provide a valid reason'
  if (!length && lengthNeeded) tmpError += '\nYou did not provide a valid length'
  return tmpError
}

module.exports = {
  sendResult,
  kickUser,
  genSpinner,
  basicLookup,
  basicUserSetup,
  buildModerationError,
  quoteRegex,
}
