const { sendResult, genSpinner, kickUser } = require('../functions')
const unlink = require('../functions/unlink')

const doUnlink = async (discordid, editable) => {
  const attemptUnlink = await unlink(discordid).catch((e) => { sendResult(e.message, { message: editable, edit: true }, 'Unable to unlink.') })
  if (!attemptUnlink) return
  const guildMember = editable.guild.members.cache.find((m) => m.id === discordid)
  if (guildMember) {
    kickUser(guildMember, editable, {
      dm: 'You have successfully unlinked.',
      channel: `Successfully unlinked <@${discordid}>`,
      log: 'User unlinked from Discord.',
    })
  }
}

exports.run = async (client, message, args) => { // eslint-disable-line no-unused-vars
  const editable = await message.channel.send(genSpinner('Attempting to unlink...'))

  if (message.cleanContent !== '!unlink') {
    const id = args.argMap.users[0] || null
    if (!message.member.hasPermission('KICK_MEMBERS') || !id) {
      sendResult('You have formatted this command incorrectly. To unlink yourself, just say `!unlink`', { message: editable, edit: true }, 'Unable to unlink.')
    } else doUnlink(id, editable)
  } else doUnlink(message.author.id, editable)
}
