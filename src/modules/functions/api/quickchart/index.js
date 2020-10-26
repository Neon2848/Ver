/* eslint-disable max-lines-per-function */
// I could get around API limits by just hotlinking to quickchart, and it would be way faster,
// but the URL length would be a limitation.

const fetch = require('node-fetch')
const secrets = require('../../../../../secrets.json')
const knownErrors = require('../../../knownErrors')

const dtOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
}

const barChart = (title, date) => ({
  title: {
    display: true,
    text: `${title} Since: ${date.toLocaleTimeString('en-us', dtOptions)}`,
    fontColor: 'rgba(26, 188, 156, 1)',
    fontSize: '16',
    fontStyle: 'bold',
    fontFamily: "'Whitney','Helvetica Neue','Helvetica','Arial',sans-serif",
  },
  legend: {
    display: false,
  },
  scales: {
    xAxes: [{
      gridLines: {
        display: false,
      },
      ticks: {
        fontColor: 'rgba(26, 188, 156, 1)',
        fontStyle: 'bold',
      },
    }],
    yAxes: [{
      gridLines: {
        color: 'rgba(20, 20, 20, 0.3)',
        drawTicks: false,
      },
      ticks: {
        fontColor: 'rgba(26, 188, 156, 1)',
        padding: 8,
      },
    }],
  },
})

const genMessageStatJSON = (orderedUsers, orderedMessages, title, date) => ({
  type: 'bar',
  data: { labels: orderedUsers, datasets: [{ label: 'Messages', data: orderedMessages }] },
  options: barChart(title, date),
})

module.exports = async (...args) => {
  const res = await fetch(`https://quickchart.io/chart?c=${JSON.stringify(genMessageStatJSON(...args))}`, {
    method: 'get',
    headers: { 'Content-Type': 'application/json' },
  }).catch(console.log)
  const arrayBuffer = await res.arrayBuffer()
  const buffer = await Buffer.from(arrayBuffer)
  console.log('do')
  return buffer
}
