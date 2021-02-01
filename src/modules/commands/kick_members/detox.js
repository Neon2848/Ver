const { genSpinner, sendResult } = require('../../functions/general')

const results = (code, message, details) => {
  let msgs = { title: '', desc: '' }
  switch (code) {
    case 1:
      msgs = {
        title: 'Success',
        desc: `Successfully ${details.targetUser} from the toxic channel`,
      }
      break
    case -1:
      msgs = { title: 'Unable to detox', desc: 'The user needs to be in the server' }
      break
    default:
      msgs = { title: 'Unable to toxic', desc: 'An unknown error occured' }
      break
  }
  sendResult(msgs.desc, { edit: true, message }, msgs.title)
}

exports.run = async (client, message, { argMap }) => { // eslint-disable-line no-unused-vars
  const { guild } = message
  const { users } = argMap

  const pendingMsg = await message.channel.send(genSpinner('Removing user from toxic...'))
  const toxicRole = await guild.roles.fetch(guild.ver.roles.toxic)
  const targetUser = await guild.members.fetch(users[0]).catch(() => {})
  if (!targetUser) {
    results(-1, pendingMsg, null)
    return
  }
  targetUser.roles.remove(toxicRole)
  results(1, pendingMsg, { targetUser })
}
