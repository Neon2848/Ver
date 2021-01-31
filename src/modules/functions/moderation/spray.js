const toxicReaction = (client, { sendMember, message }) => {
  if (!sendMember || !sendMember.hasPermission('KICK_MEMBERS')) return
  const specialReason = `${message.member.displayName}: ${message.cleanContent.substring(0, 1000)}${message.cleanContent.length > 1000 ? '...' : ''}`
  client.commands.get('toxic').run(client, message, { argMap: { users: [message.author.id], specialReason } })
}

module.exports = toxicReaction
