// Match arg where only digits exist in the arg.
const numbers = (args) => args.filter((arg) => /^[0-9]{1,17}$/.test(arg))

// Match 123456789123456789 or <@123456789123456789>
const users = (args) => {
  // By my calculations, Discord snowflakes will be 19 characters in 1.8 years,
  // and 20 characters in 68 years. So in theory this will break then. A resillient
  // solution would be to compare the arg to the IDs of all users the bot has cached.
  // but I'm not too fussed.
  const reg = new RegExp('^(?:<@!?)?([0-9]{18,20})(?:>)?$', 'gm')
  return args.filter((arg) => {
    const isValid = reg.test(arg)
    reg.lastIndex = 0
    return isValid
  }).map((filteredArg) => {
    reg.lastIndex = 0
    return reg.exec(filteredArg)[1] || null
  })
}

// Match "quotes" "with-basic" "ASCII!" "inside" (asci 33, 35 - 126)
const inQuotes = (args) => args.filter((arg) => /^"[!\21-\x7E]+"$/gm.test(arg))

// Match regex `/regex/` and convert to regular expression (or error).
const regexs = (args) => {
  const getRegexStrings = args.filter((arg) => new RegExp('^`/.+/`$', 'gm').test(arg))
  const convertToRegex = getRegexStrings.map((reg) => {
    try { return new RegExp(reg.substring(2, reg.length - 2), 'gm') } catch (e) { return e }
  })
  return convertToRegex
}

module.exports = (args) => ({
  numbers: numbers(args),
  users: users(args),
  inQuotes: inQuotes(args),
  regexs: regexs(args),
})
