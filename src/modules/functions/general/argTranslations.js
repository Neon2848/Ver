const config = require('../../../../config.json')

// Match arg where only digits exist in the arg.
const numbers = (args) => args.filter((arg) => /^[0-9]{1,16}$/.test(arg))
// It's physically impossible for a number to be >16 digits.
// JK this is just a hacky solution to the fact that user snowflakes are 17+ digits.

// Match 123456789123456789 or <@123456789123456789>
const users = (args) => {
  // By my calculations, Discord snowflakes will be 19 characters in 1.8 years,
  // and 20 characters in 68 years. So in theory this will break then. A resillient
  // solution would be to compare the arg to the IDs of all users the bot has cached.
  // but I'm not too fussed.
  const reg = new RegExp('^(?:<@!?)?([0-9]{17,20})(?:>)?$', 'gm')
  return args.filter((arg) => {
    reg.lastIndex = 0
    const isValid = reg.test(arg)
    return isValid
  }).map((filteredArg) => {
    reg.lastIndex = 0
    return reg.exec(filteredArg)[1] || null
  })
}

// Match "quotes" "with-basic" "ASCII!" "inside" (asci 33, 35 - 126)
const inQuotes = (args) => args.filter((arg) => /^"[!\21-\x7E]+"$/gm.test(arg)).map((a) => a.substring(1, a.length - 1))

// Match regex `/regex/` and convert to regular expression (or error).
const regexs = (args) => {
  const getRegexStrings = args.filter((arg) => new RegExp('^`/.+/`$', 'gm').test(arg))
  const convertToRegex = getRegexStrings.map((reg) => {
    try { return new RegExp(reg.substring(2, reg.length - 2), 'gm') } catch (e) { return e }
  })
  return convertToRegex
}

// Match only has:thing
const hasArgs = (args) => args.filter((arg) => /^has:(link|embed|file|video|image|sound)$/.test(arg))
  .map((a) => a.replace('has:', ''))
  .map((a) => {
    if (a === 'embed' || a === 'file') return a
    return new RegExp(`\\.(${config.attachmentTypes[a].join('|')})$`)
  })

const timeReg = new RegExp('^([1-9][0-9]{0,9})([hdwmy])$', 'gm')
const timeArgs = (args) => args.filter((arg) => {
  timeReg.lastIndex = 0
  const isValid = timeReg.test(arg)
  return isValid
})

const shorthandMSMap = {
  h: 3600000,
  d: 86400000,
  w: 604800000,
  m: 2629800000,
  y: 31557600000,
}

const convertTimeArgs = (args) => {
  const tA = timeArgs(args)
  const conv = tA.map((a) => {
    timeReg.lastIndex = 0
    const timeParts = timeReg.exec(a)
    const msLength = timeParts[1] * shorthandMSMap[timeParts[2]]
    return Date.now() + msLength
  })
  return conv
}

module.exports = (args) => ({
  numbers: numbers(args),
  users: users(args),
  inQuotes: inQuotes(args),
  regexs: regexs(args),
  hasArgs: hasArgs(args),
  timeArgs: convertTimeArgs(args),
})
