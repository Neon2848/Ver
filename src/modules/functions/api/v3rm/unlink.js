const v3rmApi = require('./apiCall')

const unlink = async (discordid) => v3rmApi('unlink', `?id=${encodeURIComponent(discordid)}`)
module.exports = unlink
