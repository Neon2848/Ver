const path = require('path')
const FileType = require('file-type')
const { MessageAttachment } = require('discord.js')
const moment = require('moment')
const config = require('../../../../config.json')
const knownErrors = require('../../knownErrors')
const lookup = require('../api/v3rm/lookup')
const secrets = require('../../../../secrets.json')
const { addtoRoleQueue, attemptRoleQueue } = require('../api/v3rm/userSetup')
const { logMember } = require('../database/members')
const log = require('../../../mongo/log')
const { logJoin } = require('../../../mongo/joins')

const errorReasonTransform = (err) => {
  if (err === 'Input malformed') return 'There was an issue with your input. Please use `!lookup @User` or `!lookup id`.'
  if (err === 'User does not exist') return 'This user is not currently linked.'
  return `${err.replace(`${secrets.v3rm.api.base}`, 'apibase')}.`
}

const safeDelete = (msg, t) => {
  if (!msg || msg.deleted) return
  setTimeout(() => { // Custom timeout so we can re-check to avoid 'unknown message' issue.
    if (!msg || msg.deleted) return
    msg.delete().catch(((e) => log(msg.guild.id, 'error', 'deleting message', e.message, msg)))
  }, t)
}

const msgIntegrityCheck = (message) => !(
  message.partial
  || message.author.bot
  || message.channel.type === 'dm'
  || !message.member
  || !message.channel
  || !message.guild
)

const sendResult = async (resultMsg, caller, resultTitle) => {
  const emb = {
    embed: {
      description: errorReasonTransform(resultMsg),
      color: 13441048,
      author: { name: resultTitle, icon_url: config.images.v3rmLogo },
      thumbnail: { url: config.images.botAvatar },
    },
  }
  const send = await (caller.edit ? caller.message.edit(emb) : caller.message.channel.send(emb))
  if (caller.timeout) {
    if (caller.edit) return safeDelete(caller.message, caller.timeout)
    return safeDelete(send, caller.timeout)
  }
  return send
}

const kickUser = (member, editable, reasons) => {
  if (!member || member.user.bot) return
  member.send(reasons.dm).finally(() => {
    if (reasons.channel) sendResult(reasons.channel, { message: editable, edit: editable.author.bot }, 'Kicking User')
    member.kick(reasons.log).catch((e) => sendResult(`Unable to kick user: \`${e}\``, { message: editable, timeout: 10000 }, 'Kick Error'))
  })
}

// Debounce basic lookup (per user), as it only takes a react to be called.
// Also limit the queue size to 5, so that if 5 or more users are being looked up at once
const basicLookupTable = []

const basicKickUser = (member, reason, gid) => {
  if (member.user.bot) return null
  // If joins are being flooded, kick without DM.
  if (basicLookupTable.length > 5) return member.kick('User does not have permissions.').catch((_) => knownErrors.userOperation(_, gid))

  return member.send(reason).finally(() => {
    member.kick('User does not have permissions.').catch((_) => knownErrors.userOperation(_, gid))
  }).catch(() => { })
}

const genSpinner = (spinnerInfo) => (
  { embed: { color: 16674701, author: { name: spinnerInfo, icon_url: config.images.loader } } }
)

const genericLinkInfo = (member, title, v3rmId = null) => ({
  embed: {
    color: 13441048,
    author: {
      name: member.displayName,
      icon_url: member.user.displayAvatarURL(),
      url: v3rmId ? `https://v3rm.net/m/${v3rmId}` : null,
    },
    fields: [
      { name: 'Action', value: `\`${title}\``, inline: true },
      { name: 'Tag', value: `${member.user}\n${member.user.tag}`, inline: true },
      {
        name: 'User Info',
        value: `\`\`\`ARM\n
${v3rmId ? `v3rmId: '${v3rmId}'\n` : ''}\
discordId: '${member.id}'
discordCreated: '${moment(member.user.createdAt).fromNow()} (${moment(member.user.createdAt).format('lll')})'\`\`\``,
      },
    ],
    timestamp: new Date(),
  },
})

const doBasicLookup = async (member) => {
  const details = await lookup(member.id, member.guild.id, { bypass: true, type: 'basicLookup' }).catch(() => { })
  if (!details) {
    basicKickUser(member, 'There was an issue connecting your account to our website. Please double check that you are linked on https://v3rm.net/discord.', member.guild.id)
    return { fail: true, result: 'LOOKUP_FAILED', details: null }
  }
  if (details.roles.includes('Banned') || !details.roles.length) {
    basicKickUser(member, `To prevent botting, you need to have been a site member for at least 1 month and have at least 40 posts on our website to use our Discord (or be a VIP/Elite member). Either you donn't meet these standards yet, or you're currently banned onsite. You're welcome to join when you do. (Your profile: https://v3rm.net/m/${details.uid} )`, member.guild.id)
    return { fail: true, result: 'NOT_ELIGIBLE', details }
  }
  await logMember(member.guild.id, member, details.uid)
  await addtoRoleQueue(member.id, member, details.username, details.roles)
  const result = await attemptRoleQueue()
  return { fail: false, result, details }
}

const performBasicLookup = async (member) => {
  const raid = basicLookupTable.length > 5
  const { guild: { channels: { cache }, ver: { channels: { activationLog } } } } = member
  const aChannel = cache.get(activationLog)

  if (raid) { // If the lookup queue is full, don't DM/Log.
    const finishedMember = await doBasicLookup(member)
    return finishedMember.result
  }

  const logLookup = await aChannel.send(genSpinner(`Looking up new member: ${member.user.tag} / ${member.user.id}`))
  await logJoin(member.guild.id, member.id, logLookup.id) // db save id of join msg
  const finishedMember = await doBasicLookup(member)
  switch (finishedMember.result) {
    case 'LOOKUP_FAILED':
      logLookup.edit(genericLinkInfo(member, 'User is not linked.'))
      break
    case 'NOT_ELIGIBLE':
      logLookup.edit(genericLinkInfo(member, 'User found, but they are banned/unactivated or don\'t qualify.', finishedMember.details.uid))
      break
    default:
      logLookup.edit(genericLinkInfo(member, 'User successfully linked.', finishedMember.details.uid))
  }
  return finishedMember
}

// We wait 5.1s and re-call the function. This should avoid API abuse if join raid.
const basicLookup = async (member) => {
  if (basicLookupTable.includes(member.id)) return null
  if (basicLookupTable.length >= 4) {
    await new Promise((r) => setTimeout(r, 5100))
    const tM = await basicLookup(member)
    return tM
  }
  basicLookupTable.push(member.id)
  const theMember = await performBasicLookup(member)
  basicLookupTable.splice(basicLookupTable.indexOf(member.id), 1)
  return theMember
}

const quoteRegex = (msg) => {
  const regParts = new RegExp(/([“”""””])(.+)([“”""””])/, 'gm').exec(msg)
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
const inCachePerform = (memb, theCache, fetchIndex, member, date, expireSecs) => {
  if (memb.length) {
    if ((date - memb[0].date) / 1000 < expireSecs) return true // Their entry hasn't expired
    // eslint-disable-next-line no-param-reassign
    theCache[fetchIndex] = { member, date } // Update their old entry, it's expired
    return false
  }
  if (theCache.length > 50) theCache.shift()
  theCache.push({ member, date })
  return false
}

const inCacheUpsert = (type, message, expireSecs) => {
  const member = message.member.id
  const theCache = message.guild.ver.queues[type]
  let fetchIndex = -1
  const memb = theCache.filter((entry, i) => {
    if (entry.member === member) { fetchIndex = i; return true } return false
  })
  const date = Date.now()

  return inCachePerform(memb, theCache, fetchIndex, member, date, expireSecs)
}

const recreateEmoji = (name, guild) => {
  if (!name === 'spray' || !name === 'raysA' || !name === 'raysS') return
  const pth = path.join(__dirname, '../../../', 'images', `${name}Backup.png`)
  guild.emojis.create(pth, name)
}

/* eslint-disable no-bitwise */
const decToRGB = (dec) => ({
  r: (dec & 0xff0000) >> 16,
  g: (dec & 0x00ff00) >> 8,
  b: (dec & 0x0000ff),
})
/* eslint-enable no-bitwise */

const toNameArray = (sStats) => sStats.map((stat) => {
  const name = stat.member[0]?.displayName.replace(/[^a-zA-Z\d]/gm, '') || 'Unknown'
  return name.length > 8 ? `${name.substring(0, 7)}...` : name
})

const toColorArray = (sStats) => sStats.map((stat) => {
  const rgb = decToRGB(stat.member[0]?.topRoleColor || 0)
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`
})

const toFieldArray = (sStats, key) => sStats.map((stat) => stat[key])

const dtOptions = {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  year: '2-digit',
  minute: '2-digit',
}

const sendFile = async (buffer, editable, sDF = null, eDF = null) => {
  if (await FileType.fromBuffer(buffer) === undefined) {
    sendResult(buffer.toString().trim(), { message: editable, edit: true }, 'Unable to generate graph.')
    return false
  }

  const theMessage = sDF
    ? `Message Activity Between: \`${sDF.toLocaleTimeString('en-gb', dtOptions)}\` and \`${eDF.toLocaleTimeString('en-gb', dtOptions)}\` UTC.`
    : '`Number of approved votemutes per user:`'

  const file = new MessageAttachment(buffer, 'chart.png')
  await editable.channel.send(theMessage, { files: [file] }).then(() => safeDelete(editable, 0))
  return true
}

module.exports = {
  sendResult,
  msgIntegrityCheck,
  kickUser,
  genSpinner,
  basicLookup,
  buildModerationError,
  quoteRegex,
  inCacheUpsert,
  recreateEmoji,
  safeDelete,
  toNameArray,
  toColorArray,
  toFieldArray,
  sendFile,
  genericLinkInfo,
  basicKickUser,
}
