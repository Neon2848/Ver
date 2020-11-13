exports.run = (client, message, args) => {
  // Updateme is just an alias for lookup with a fixed ID.
  if (args.raw.length) return
  client.commands.get('lookup').run(client, message, { argMap: { users: [message.author.id] } }, 'updateme')
}
