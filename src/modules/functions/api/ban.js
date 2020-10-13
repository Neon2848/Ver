const v3rmApi = require('./apiCall')

const warn = async (discordid, reason, days) => v3rmApi('ban', `?discordid=${encodeURIComponent(discordid)}&banreason=${encodeURIComponent(reason)}&days=${parseInt(days, 10)}`)
module.exports = warn
