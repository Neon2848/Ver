const { getServerStats, getUserStats } = require('../../../mongo/stats')
const { getBar, getLine } = require('../../functions/api/quickchart')
const {
  sendResult, genSpinner, safeDelete, toNameArray, toColorArray, toFieldArray, sendFile,
} = require('../../functions/general')

let lastCall = Date.now()
const maxCall = 30 * 1000

const checkCall = (member, dNow) => {
  if (member.hasPermission('KICK_MEMBERS')) return true
  if (maxCall - Math.abs(dNow - lastCall) > 0) return false
  lastCall = dNow
  return true
}

const getAllHoursSinceDate = (date) => {
  date.setHours(date.getHours(), 0, 0, 0)
  let then = date.getTime()
  const now = Date.now()

  const hours = []
  while (then < now) {
    hours.push(then)
    then += (60 * 60 * 1000)
  }
  return hours
}

const extraBarData = (pToData, pFromData) => [
  {
    label: 'Pings Received', data: pToData, backgroundColor: '#f4b2ff', yAxisID: 'b',
  },
  {
    label: 'Pings Sent', data: pFromData, backgroundColor: '#f7b2b2', yAxisID: 'b',
  },
]

const convertDataToBar = (sStats, showPings) => {
  const labels = toNameArray(sStats)
  const colours = toColorArray(sStats)
  const data = toFieldArray(sStats, 'messages')

  if (showPings) {
    const pToData = toFieldArray(sStats, 'pTo')
    const pFromData = toFieldArray(sStats, 'pFrom')
    return {
      labels,
      data,
      colours: '#a4bdf4',
      extraData: extraBarData(pToData, pFromData),
    }
  }
  return {
    labels, data, colours, extraData: [],
  }
}

const doBarGraph = async (message, sDF, eDF, graphLength, args, editable) => {
  const sStats = await getServerStats(message.guild.id, sDF, eDF, parseInt(graphLength, 10))
  const showPings = args.raw.includes('pings')
  const {
    labels, data, colours, extraData,
  } = convertDataToBar(sStats, showPings)

  const buffer = await getBar(labels, data, colours, extraData)
  sendFile(buffer, editable, sDF, eDF)
}

const mapDataToHours = (h, hours, sStats) => {
  let dataStarted = false
  const hourIndex = hours.indexOf(h)
  if (hourIndex === -1) {
    if (dataStarted) {
      return {
        date: h, messages: 0, pTo: 0, pFrom: 0,
      }
    }
    return null
  }
  dataStarted = true
  return sStats[hourIndex]
}

const convertDataToLine = (sStats, sDF) => {
  const hours = sStats.map((stat) => stat.date.getTime())

  const tempMap = getAllHoursSinceDate(sDF)
    .map((h) => mapDataToHours(h, hours, sStats))
    .filter((_) => !!_)

  const tHours = tempMap.map((stat) => new Date(stat.date).toLocaleTimeString('en-gb', { dateStyle: 'short', timeStyle: 'short' }).replace(/\/20([0-9][0-9]),/, '/$1,'))
  const tMsgs = toFieldArray(tempMap, 'messages')
  const tPTo = toFieldArray(tempMap, 'pTo')
  const tPFrom = toFieldArray(tempMap, 'pFrom')

  const datasets = [{
    label: 'Messages', data: tMsgs, borderColor: '#a4bdf4', pointRadius: 1,
  },
  {
    label: 'Pings Received', data: tPTo, borderColor: '#f4b2ff', fill: false, pointRadius: 1,
  },
  {
    label: 'Pings Sent', data: tPFrom, borderColor: '#f7b2b2', fill: false, pointRadius: 1,
  }]

  return { tHours, datasets }
}

const doLineGraph = async (message, sDF, eDF, args, editable) => {
  const id = args.argMap.users[0]
  const sStats = await getUserStats(message.guild.id, sDF, eDF, id)

  const { tHours, datasets } = convertDataToLine(sStats, sDF)

  const buffer = await getLine(tHours, datasets)
  await sendFile(buffer, editable, sDF, eDF)
  return true
}

const graphDecisionEngine = async (message, dNow, argMap) => {
  if (!checkCall(message.member, dNow)) { safeDelete(message, 0); return null }

  const editable = await message.reply(genSpinner('Generating graph...'))

  const startTimeframe = argMap.timeArgs[0] - dNow || (7 * 24 * 60 * 60 * 1000)
  const sDF = new Date(dNow - startTimeframe)
  sDF.setHours(sDF.getHours(), 0, 0, 0)

  const eDF = new Date(dNow - (argMap.timeArgs[1] - dNow) || dNow)
  if (eDF <= sDF) {
    sendResult('That timeframe makes no sense', { message: editable, edit: true, timeout: 3000 }, 'Stats Issue')
    return null
  }
  const graphLength = parseInt(argMap.numbers[0] || 5, 10)
  if (graphLength > 100) {
    sendResult('I can\'t display that much data', { message: editable, edit: true, timeout: 3000 }, 'Stats Issue')
    return null
  }
  return {
    sDF, eDF, graphLength, bar: argMap.users.length, editable,
  }
}

exports.run = async (client, message, args) => { // eslint-disable-line no-unused-vars
  const dNow = Date.now()

  const decision = await graphDecisionEngine(message, dNow, args.argMap)
  if (!decision) return false
  const {
    sDF, eDF, graphLength, bar, editable,
  } = decision

  if (bar) await doLineGraph(message, sDF, eDF, args, editable)
  else await doBarGraph(message, sDF, eDF, graphLength, args, editable)
  return true
}
