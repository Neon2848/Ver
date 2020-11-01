const io = require('@pm2/io')
const knownErrors = require('../../../knownErrors')
// Various factors may cause setNickname and roles.add to fail.
// Such factors include ratelimits and accounts with names that bug Discord.
// This file provides a hacky, but functional solution to this.
// Failures are stored in memory and retried 3 times, the final failure will attempt to kick.
const failedRoleQueue = []

const roleQueueMetric = io.metric({
  name: 'Role Queue Size',
  type: 'histogram',
  measurement: 'mean',
})
roleQueueMetric.set(0)

// Upsert the user and the details we are trying to change.
const addtoRoleQueue = async (id, member, nickChange, rolesToAdd = []) => {
  const realRolesToAdd = rolesToAdd?.filter((r) => r !== 'Member') || []
  const exists = failedRoleQueue.some((entry, i) => {
    if (entry.id === id) {
      failedRoleQueue[i] = {
        id,
        member,
        rolesToAdd: new Set([...[...entry.rolesToAdd].concat(realRolesToAdd)]),
        nickChange,
        attempts: entry.attempts + 1,
      }
      return true
    }
    return false
  })
  if (!exists) {
    failedRoleQueue.push({
      id, member, rolesToAdd: new Set([...realRolesToAdd]), nickChange, attempts: 0,
    })
  }
  roleQueueMetric.set(failedRoleQueue.length)
}

// Try to the new role/nickname
const basicUserSetup = async (details, member) => {
  const rolesToAdd = details.roles.map((role) => member.guild.roles.cache.find((guildRole) => guildRole.name === role && guildRole.name !== 'Member')).filter((r) => !!r)
  if (details.username) await member.setNickname(member.user.username === details.username ? `${member.user.username}\u200E` : details.username).catch((e) => { throw e })
  if (rolesToAdd.length) await member.roles.add(rolesToAdd).catch((e) => { throw e })
  return member
}

// Attempt to apply the 0th index of the queue. On fail, call addToRoleQueue to upsert.
const attemptRoleQueue = async () => {
  if (!failedRoleQueue[0]) return null
  const rQ = failedRoleQueue[0]
  if (!rQ.member) {
    failedRoleQueue.shift()
    return rQ.member
  }
  const success = await basicUserSetup({
    username: rQ.nickChange,
    roles: [...rQ.rolesToAdd],
  }, rQ.member).catch(async () => {
    if (rQ.attempts >= 2) {
      // eslint-disable-next-line no-undef
      await rQ.member.send('There was an unexpected error assigning your roles/nickname, we can\'t let you in the server if we can\'t manage your account.').finally(() => { rQ.member.kick('Unable to assign roles').catch((_) => knownErrors.userOperation(_, rQ.member.guild.id)) })
      failedRoleQueue.shift()
    } else {
      await addtoRoleQueue(rQ.id, rQ.member, rQ.nickChange)
    }
  })
  roleQueueMetric.set(failedRoleQueue.length)
  if (!success) return []
  failedRoleQueue.shift()
  roleQueueMetric.set(failedRoleQueue.length)
  return rQ.member
}

module.exports = {
  addtoRoleQueue,
  attemptRoleQueue,
  basicUserSetup,
}
