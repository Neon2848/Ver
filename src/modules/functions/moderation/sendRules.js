/* eslint-disable max-lines-per-function */
const path = require('path')

const sendRules = async (channel, full = true) => {
  await channel.send({ files: [{ attachment: path.join(__dirname, '../../../images', 'join_Rules.png'), name: 'rules.jpg' }] })

  await channel.send(`\
  By using this Discord in any way, you agree to follow our site rules when interacting with the chat in any way.\
 The site rules can be found here: https://v3rmillion.net/siterules.php . More importantly, you agree to follow the Discord Community Guidelines (https://discordapp.com/guidelines)\
 and Terms of Service (https://discordapp.com/terms).

\`\`\`diff\n
! Among the things you are agreeing to by following the 3 rule-sets above are:
- You are over the age of 13.
- You will not post **any** NSFW content.
- You will not post homophobic or racist content, nor use derogatory words **even in a non-derogatory context** relating to such content.
- You will not post spam, or harass users.
- You will not share any personal information relating to anyone, even non-users. Do not dox or threaten to share the personal information of another person.
- You will not do anything illegal under United States law OR the laws in your respective country.
- You will not distribute viruses, "engage in or promote phishing activities", or "threaten another user with digital harm including but not limited to viruses, hacking, and spying."\`\`\`

\`\`\`diff\n
- You will not encourage, promote, or glorify software hacking, exploiting, or other malicious digital activity.
- You will not encourage, promote, or glorify the sale/trade/distribution of stolen items or accounts.
\`\`\`

You will be banned from this server for any notable violation of the above rulesets, and your account on our website will likely also receive the appropriate repercussions.
`)

  await channel.send({ files: [{ attachment: path.join(__dirname, '../../../images', 'join_Rules.png'), name: 'rules.jpg' }] })

  await channel.send(`\
The bots running on this server all adhere to the Discord Developer Terms of Service. By using this server, you understand and consent that we store the following things:

-Your Discord ID, a small string identifying your account, for the purpose of determining who you are on our website and applying the respective username, nickname, and role.
-Seven days worth of chat deletion/edit logs for the purpose of moderation, so that we can ensure that all users are following our rules, the Discord Community Guidlines, and the Discord and Terms of Service.

\`\`\`md\n
If you wish for us to delete your data, use the   <!unlink>   command (in a different channel).\
You will be removed from the server, and will have to re-link your data on v3rmillion.net/discord if you wish to rejoin.\
To update your server role and nickname (if your site membership or username change), use the    <!updateme>   command. This command can only be used once per 30 seconds globally.
\`\`\``)

  if (full) {
    await channel.send({ files: [{ attachment: path.join(__dirname, '../../../images', 'join_Agree.png'), name: 'rules.jpg' }] })
    await channel.send('```fix\nIn order to start interacting with our server, please type "I agree" below, signifying that you agree to the above terms.```')
  }

  return true
}

module.exports = sendRules
