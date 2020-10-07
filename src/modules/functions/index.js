const config = require('../../../config.json')

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

const genSpinner = (spinnerInfo) => (
  { embed: { color: 16674701, author: { name: spinnerInfo, icon_url: config.images.loader } } }
)

module.exports = {
  getFirstTagID,
  sendResult,
  kickUser,
  genSpinner,
}
