/* eslint-disable max-lines-per-function */
// I could get around API limits by just hotlinking to quickchart, and it would be way faster,
// but the URL length would be a limitation.

const fetch = require('node-fetch')

const barChart = () => ({
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
  plugins: {
    datalabels: {
      anchor: 'end',
      align: 'center',
      color: '#000',
      backgroundColor: 'rgba(249, 249, 249, 1)',
      borderColor: 'rgba(251, 247, 245, 1)',
      borderWidth: 1,
      borderRadius: 2,
      padding: 2,
      clamp: true,
    },
  },
})

const barChartWithPings = () => ({
  legend: {
    labels: {
      fontColor: 'rgba(255, 255, 255, 0.7)',
      fontSize: 12,
      fontStyle: 'bold',
    },
  },
  scales: {
    xAxes: [{
      gridLines: {
        display: false,
      },
      ticks: {
        fontColor: 'rgba(255, 255, 255, 0.7)',
        fontStyle: 'bold',
      },
    }],
    yAxes: [{
      id: 'a',
      gridLines: {
        color: 'rgba(255, 255, 255, 0)',
        drawTicks: false,
      },
      scaleLabel: {
        display: true,
        labelString: 'No. Of Messages',
        fontColor: 'rgba(255, 255, 255, 0.7)',
      },
      ticks: {
        fontColor: 'rgba(255, 255, 255, 0.7)',
        padding: 8,
      },
    }, {
      id: 'b',
      gridLines: {
        color: 'rgba(255, 255, 255, 0.7)',
        drawTicks: false,
      },
      position: 'right',
      scaleLabel: {
        display: true,
        labelString: 'No. Of Pings',
        fontColor: 'rgba(255, 255, 255, 0.7)',
      },
      ticks: {
        fontColor: 'white',
        padding: 8,
      },
    }],
  },
})

const lineGraph = () => ({
  legend: {
    labels: {
      fontColor: 'rgba(0, 255, 255, 0.7)',
      fontSize: 12,
      fontStyle: 'bold',
    },
  },
  scales: {
    xAxes: [{
      gridLines: {
        color: 'rgba(0, 255, 255, 0.1)',
        drawTicks: false,
      },
      ticks: {
        fontColor: 'rgba(0, 255, 255, 0.5)',
        fontStyle: 'bold',
        fontSize: 14,
        padding: 8,
      },
    }],
    yAxes: [{
      gridLines: {
        color: 'rgba(255, 255, 255, 0.1)',
        drawTicks: false,
      },
      ticks: {
        fontColor: 'rgba(255, 255, 255, 0.7)',
        fontStyle: 'bold',
      },
    }],
  },
})

const getGraph = async (data) => {
  const res = await fetch('https://quickchart.io/chart', {
    method: 'post',
    body: JSON.stringify({ c: data }),
    headers: { 'Content-Type': 'application/json' },
  }).catch((_) => { throw _ })
  const arrayBuffer = await res.arrayBuffer()
  const buffer = await Buffer.from(arrayBuffer)
  return buffer
}

const getBar = async (orderedUsers, orderedMessages, orderedRoles, pingData) => {
  const datasets = [{ label: 'Messages', data: orderedMessages, backgroundColor: orderedRoles }, ...pingData]
  const res = await getGraph({
    type: 'bar',
    data: { labels: orderedUsers, datasets },
    options: pingData.length ? barChartWithPings() : barChart(),
  })
  return res
}

const getLine = async (hours, datasets) => {
  const res = await getGraph({
    type: 'line',
    data: { labels: hours, datasets },
    options: lineGraph(),
  })
  return res
}

module.exports = { getBar, getLine }
