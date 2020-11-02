const path = require('path')
const config = require('../../../../config.json')
const knownErrors = require('../../knownErrors')
const lookup = require('../api/v3rm/lookup')
const secrets = require('../../../../secrets.json')
const { addtoRoleQueue, attemptRoleQueue } = require('../api/v3rm/userSetup')
const { logMember } = require('../database/members')

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
    sendResult(reasons.channel, { message: editable, edit: true, timeout: 10000 }, 'Kicking User')
    member.kick(reasons.log).catch((e) => sendResult(`Unable to kick user: \`${e}\``, { message: editable, timeout: 10000 }, 'Kick Error'))
  })
}

const basicKickUser = (member, reason, gid) => {
  if (member.user.bot) return
  member.send(reason).finally(() => {
    member.kick('User does not have permissions on site').catch((_) => knownErrors.userOperation(_, gid))
  }).catch(() => {})
}

const genSpinner = (spinnerInfo) => (
  { embed: { color: 16674701, author: { name: spinnerInfo, icon_url: config.images.loader } } }
)

const basicLookup = async (member) => {
  const details = await lookup(member.id, member.guild.id, { bypass: true, type: 'basicLookup' }).catch(() => {})
  if (!details) return basicKickUser(member, 'There was an issue connecting your account to our website. Please double check that you are linked on https://v3rm.net/discord.', member.guild.id)
  if (details.roles.includes('Banned') || !details.roles.length) {
    return basicKickUser(member, 'Your site account is either banned or unactivated. Once this is resolved, you will be allowed to join our server.', member.guild.id)
  }
  await logMember(member.guild.id, member, details.uid)
  await addtoRoleQueue(member.id, member, details.username, details.roles)
  const finishedMember = await attemptRoleQueue()
  return finishedMember
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

/* This function handles in-memory storage of users, for things like:
   - list of users who have already been sent a DM about the word filter
   - list of users who have pinged someone recently
   These caches are not vital, and don't need to be stored in the database.
   They are set to only store 50 users at once (each).
*/
const inCacheUpsert = (type, message, expireSecs) => {
  const member = message.member.id
  const theCache = message.guild.giuseppeQueues[type]
  let fetchIndex = -1
  const memb = theCache.filter((entry, i) => {
    if (entry.member === member) { fetchIndex = i; return true } return false
  })
  const date = Date.now()

  // The member is currently in the cache
  if (memb.length) {
    if ((date - memb[0].date) / 1000 < expireSecs) return true // Their entry hasn't expired
    theCache[fetchIndex] = { member, date } // Update their old entry, it's expired
    return false
  }
  if (theCache.length > 50) theCache.shift()
  theCache.push({ member, date })
  return false
}

const recreateEmoji = (name, guild) => {
  let newImage = null
  if (name === 'spray') newImage = { name: 'spray', file: 'sprayBackup.png' }
  if (name === 'raysA') newImage = { name: 'raysA', file: 'raysABackup.png' }

  if (newImage) {
    const pth = path.join(__dirname, '../../../', 'images', newImage.file)
    guild.emojis.create(pth, newImage.name)
  }
}

module.exports = {
  sendResult,
  kickUser,
  genSpinner,
  basicLookup,
  buildModerationError,
  quoteRegex,
  inCacheUpsert,
  recreateEmoji,
}
