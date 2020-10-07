const config = require('../../../config.json')
const knownErrors = require('../knownErrors')
const lookup = require('./lookup')

const getFirstTagID = (args) => {
  if (!args.length) return null
  const cleanArg = args[0].replace(/<@!/, '').replace('/>/', '').match(/[0-9]{12,32}/) // Match id or <@!id>
  if (!cleanArg || !cleanArg[0]) return null
  return cleanArg[0]
}

const errorReasonTransform = (err) => {
  if (err === 'Input malformed') return 'There was an issue with your input. Please use `!lookup @User` or `!lookup id`.'
  if (err === 'User does not exist') return 'This user is not currently linked.'
  return `${err}.`
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
      if (caller.edit) return caller.message.delete({ timeout: caller.timeout })
      return _.delete({ timeout: caller.timeout })
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

const basicLookup = async (member) => {
  const details = await lookup(member.id, member.guild.id, { bypass: true, type: 'basicLookup' }).catch(() => {
    basicKickUser(member, 'There was an issue connecting your account to our website. Please double check that you are linked on https://v3rm.net/discord.', member.guild.id)
  })
  if (!details) return
  if (details.roles.includes('Banned') || !details.roles.length) {
    basicKickUser(member, 'Your site account is either banned or unactivated. Once this is resolved, you will be allowed to join our server.', member.guild.id).filter((r) => !!r)
    return
  }
  const rolesToAdd = details.roles.map((role) => member.guild.roles.cache.find((guildRole) => guildRole.name === role && guildRole.name !== 'Member'))
  member.setNickname(member.user.username === details.username ? `${member.user.username}\u200E` : details.username)
  if (rolesToAdd.length) member.roles.add(rolesToAdd)
}

module.exports = {
  getFirstTagID,
  sendResult,
  kickUser,
  genSpinner,
  basicLookup,
}
