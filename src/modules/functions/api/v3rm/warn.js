const v3rmApi = require('./apiCall')

const warn = async (discordid, reason) => v3rmApi('warn', `?id=${encodeURIComponent(discordid)}&reason=${encodeURIComponent(reason)}`)
module.exports = warn
