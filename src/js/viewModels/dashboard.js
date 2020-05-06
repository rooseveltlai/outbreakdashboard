/*
 * Your dashboard ViewModel code goes here
 */
define(['../appController', 'knockout', 'jquery', 'ojs/ojbootstrap', 'ojs/ojarraydataprovider', 'ojs/ojconverter-datetime', 'ojs/ojknockout', 'ojs/ojchart', 'ojs/ojselectsingle'],
  function (app, ko, $, Bootstrap, ArrayDataProvider, DateTimeConverter) {
    function DashboardViewModel () {
      var self = this
      self.chartDataDailyNewCases = ko.observableArray()
      self.chartDataDailyTests = ko.observableArray()
      self.chartDataDailyNewCasePct = ko.observableArray()
      self.chartDataDailyNewCasePctTotal = ko.observableArray()

      self.chartDataDailyNewDeath = ko.observableArray()
      self.chartDataDeathRate = ko.observableArray()
      self.chartDataDailyNewHospitalized = ko.observableArray()
      self.chartDataCurrentlyHospitalized = ko.observableArray()
      self.chartDataCurrentlyInICU = ko.observableArray()

      self.chartDataTotalCases = ko.observableArray()
      self.chartDataTotalTests = ko.observableArray()
      self.chartDataTotalDeath = ko.observableArray()

      self.xAxisOptions = ko.observable({})

      self.latestData = ko.observable()

      self.states = ko.observableArray()
      self.stateSelected = ko.observable('USA')

      // Below are a set of the ViewModel methods invoked by the oj-module component.
      // Please reference the oj-module jsDoc for additional information.

      /**
       * Optional ViewModel method invoked after the View is inserted into the
       * document DOM.  The application can put logic that requires the DOM being
       * attached here.
       * This method might be called multiple times - after the View is created
       * and inserted into the DOM and after the View is reconnected
       * after being disconnected.
       */
      self.connected = function () {
        document.title = 'Dashboard - Coronavirus Outbreak Dashboard'
        loadState()
      }

      self.dataProviderDailyNewCases = new ArrayDataProvider(self.chartDataDailyNewCases, { keyAttributes: 'id' })
      self.dataProviderDailyNewTests = new ArrayDataProvider(self.chartDataDailyTests, { keyAttributes: 'id' })
      self.dataProviderDailyNewCasePct = new ArrayDataProvider(self.chartDataDailyNewCasePct, { keyAttributes: 'id' })
      self.dataProviderDailyNewCasePctTotal = new ArrayDataProvider(self.chartDataDailyNewCasePctTotal, { keyAttributes: 'id' })
      self.dataProviderDailyNewDeath = new ArrayDataProvider(self.chartDataDailyNewDeath, { keyAttributes: 'id' })
      self.dataProviderDeathRate = new ArrayDataProvider(self.chartDataDeathRate, { keyAttributes: 'id' })
      self.dataProviderDailyNewHospitalized = new ArrayDataProvider(self.chartDataDailyNewHospitalized, { keyAttributes: 'id' })
      self.dataProviderCurrentlyHospitalized = new ArrayDataProvider(self.chartDataCurrentlyHospitalized, { keyAttributes: 'id' })
      self.dataProviderCurrentlyInICU = new ArrayDataProvider(self.chartDataCurrentlyInICU, { keyAttributes: 'id' })

      self.dataProviderTotalCases = new ArrayDataProvider(self.chartDataTotalCases, { keyAttributes: 'id' })
      self.dataProviderTotalTests = new ArrayDataProvider(self.chartDataTotalTests, { keyAttributes: 'id' })
      self.dataProviderTotalDeath = new ArrayDataProvider(self.chartDataTotalDeath, { keyAttributes: 'id' })

      self.dataProviderStates = new ArrayDataProvider(self.states, { keyAttributes: 'value' })

      /**
       * Optional ViewModel method invoked after the View is disconnected from the DOM.
       */
      self.disconnected = function () {
        // Implement if needed
      }

      /**
       * Optional ViewModel method invoked after transition to the new View is complete.
       * That includes any possible animation between the old and the new View.
       */
      self.transitionCompleted = function () {}

      self.latestValue = ko.pureComputed(function () {
        let size = self.chartDataDailyNewCases().length
        if (size) {
          return self.chartDataDailyNewCases()[size - 1].value
        } else {
          return 0
        }
      })

      self.valueChangedHandler = function (event) {
        let state = event.detail.value === 'USA' ? 'us' : event.detail.value
        loadCharts(state)
      }

      self.onClickHandler = function (event) {
        setTimeout(function () {$('#selectRegion input').select()}, 50)
      }

      self.latestNum = function (prop) {
        return self.latestData() && typeof self.latestData()[prop] == 'number' ? self.latestData()[prop].toLocaleString() : ''
      }

      function loadState () {
        $.getJSON('https://covidtracking.com/api/v1/states/info.json', function (data) {
          let stateList = []
          stateList.push({
            value: 'USA',
            label: 'United States'
          })

          data.forEach(d => {
            stateList.push({
              value: d.state,
              label: d.name
            })
          })

          ko.utils.arrayPushAll(self.states, stateList)
        })
      }

      function loadCharts (state) {
        app.loading(true)
        self.dailyNewCases = []
        self.dailyNewCasesSMA = []
        self.dailyNewTests = []
        self.dailyNewTestsSMA = []
        self.dailyNewCasePct = []
        self.dailyNewCasePctSMA = []
        self.dailyNewCasePctTotal = []
        self.dailyNewCasePctTotalSMA = []
        self.dailyNewDeath = []
        self.dailyNewDeathSMA = []
        self.dailyDeathRate = []
        self.dailyDeathRateSMA = []
        self.dailyNewHospitalized = []
        self.dailyNewHospitalizedSMA = []
        self.hospitalizedCurrently = []
        self.hospitalizedCurrentlySMA = []
        self.inICUCurrently = []
        self.inICUCurrentlySMA = []

        self.totalCases = []
        self.totalCasesSMA = []
        self.totalTests = []
        self.totalTestsSMA = []
        self.totalDeath = []
        self.totalDeathSMA = []

        let url = `https://covidtracking.com/api/v1/${state != 'us' ? ('states/' + state) : state}/daily.json`
        $.getJSON(url, function (data) {
          data = preprocessData(data)
          extractChartData(data, 'positiveIncrease', self.dailyNewCases, self.dailyNewCasesSMA, 'Daily New Cases', '7 day Moving Average')
          extractChartData(data, 'totalTestResultsIncrease', self.dailyNewTests, self.dailyNewTestsSMA, 'Daily New Tests', '7 day Moving Average')
          extractChartData(data, 'newPositivePct', self.dailyNewCasePct, self.dailyNewCasePctSMA, 'Daily New Cases / New Tests', '7 day Moving Average')
          extractChartData(data, 'newPositivePctTotal', self.dailyNewCasePctTotal, self.dailyNewCasePctTotalSMA, 'Daily New Cases / Total Cases', '7 day Moving Average')
          extractChartData(data, 'deathIncrease', self.dailyNewDeath, self.dailyNewDeathSMA, 'Daily New Death', '7 day Moving Average')
          extractChartData(data, 'deathRate', self.dailyDeathRate, self.dailyDeathRateSMA, 'Death Rate', '7 day Moving Average')
          extractChartData(data, 'hospitalizedIncrease', self.dailyNewHospitalized, self.dailyNewHospitalizedSMA, 'Daily New Hospitalized', '7 day Moving Average')
          extractChartData(data, 'hospitalizedCurrently', self.hospitalizedCurrently, self.hospitalizedCurrentlySMA, 'Currently Hospitalized', '7 day Moving Average')
          extractChartData(data, 'inIcuCurrently', self.inICUCurrently, self.inICUCurrentlySMA, 'Currently In ICU', '7 day Moving Average')

          extractChartData(data, 'positive', self.totalCases, self.totalCasesSMA, 'Total Cases', '7 day Moving Average')
          extractChartData(data, 'totalTestResults', self.totalTests, self.totalTestsSMA, 'Total Tests', '7 day Moving Average')
          extractChartData(data, 'death', self.totalDeath, self.totalDeathSMA, 'Total Death', '7 day Moving Average')

          /* chart data */
          self.chartDataDailyNewCases.removeAll()
          self.chartDataDailyTests.removeAll()
          self.chartDataDailyNewCasePct.removeAll()
          self.chartDataDailyNewCasePctTotal.removeAll()
          self.chartDataDailyNewDeath.removeAll()
          self.chartDataDeathRate.removeAll()
          self.chartDataDailyNewHospitalized.removeAll()
          self.chartDataCurrentlyHospitalized.removeAll()
          self.chartDataCurrentlyInICU.removeAll()
          self.chartDataTotalCases.removeAll()
          self.chartDataTotalTests.removeAll()
          self.chartDataTotalDeath.removeAll()

          ko.utils.arrayPushAll(self.chartDataDailyNewCases, self.dailyNewCases.concat(self.dailyNewCasesSMA))
          ko.utils.arrayPushAll(self.chartDataDailyTests, self.dailyNewTests.concat(self.dailyNewTestsSMA))
          ko.utils.arrayPushAll(self.chartDataDailyNewCasePct, self.dailyNewCasePct.concat(self.dailyNewCasePctSMA))
          ko.utils.arrayPushAll(self.chartDataDailyNewCasePctTotal, self.dailyNewCasePctTotal.concat(self.dailyNewCasePctTotalSMA))
          ko.utils.arrayPushAll(self.chartDataDailyNewDeath, self.dailyNewDeath.concat(self.dailyNewDeathSMA))
          ko.utils.arrayPushAll(self.chartDataDeathRate, self.dailyDeathRate.concat(self.dailyDeathRateSMA))
          ko.utils.arrayPushAll(self.chartDataDailyNewHospitalized, self.dailyNewHospitalized.concat(self.dailyNewHospitalizedSMA))
          ko.utils.arrayPushAll(self.chartDataCurrentlyHospitalized, self.hospitalizedCurrently.concat(self.hospitalizedCurrentlySMA))
          ko.utils.arrayPushAll(self.chartDataCurrentlyInICU, self.inICUCurrently.concat(self.inICUCurrentlySMA))

          ko.utils.arrayPushAll(self.chartDataTotalCases, self.totalCases.concat(self.totalCasesSMA))
          ko.utils.arrayPushAll(self.chartDataTotalTests, self.totalTests.concat(self.totalTestsSMA))
          ko.utils.arrayPushAll(self.chartDataTotalDeath, self.totalDeath.concat(self.totalDeathSMA))

          let today = new Date(Date.parse(data[0].dateChecked))
          let start = new Date()
          start.setDate(today.getDate() - 45)

          var dateOptions = { day: 'numeric', month: 'numeric' }
          self.dayMonth = new DateTimeConverter.IntlDateTimeConverter(dateOptions)
          self.xAxisOptions({ 
            tickLabel: { converter: [ko.toJS(self.dayMonth)], style: "font-size:10px" }, 
            viewportStartGroup: start, 
            viewportEndGroup: today
          })

          let dateStr = data[0].date.toString()
          data[0].latestDate = dateStr.substring(0, 4) + '-' + dateStr.substring(4, 6) + '-' + dateStr.substring(6, 8)
          self.latestData(data[0])

          app.lastUpd(data[0].latestDate)
          app.loading(false)
        })
      }
    }

    /*
     * Returns an instance of the ViewModel providing one instance of the ViewModel. If needed,
     * return a constructor for the ViewModel so that the ViewModel is constructed
     * each time the view is displayed.
     */
    return DashboardViewModel
  }
)

function extractChartData (data, dataProp, seriesArray, seriesSMAArray, seriesName, seriesSMAName) {
  let i = data.length
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i][dataProp] == null) continue
    let sma = -1
    if (i < data.length - 6) {
      if (data[i + 1][dataProp] != null && data[i + 2][dataProp] != null && data[i + 3][dataProp] != null && data[i + 4][dataProp] != null
          && data[i + 5][dataProp] != null && data[i + 6][dataProp] != null) {
        sma = (data[i][dataProp] +
          data[i + 1][dataProp] +
          data[i + 2][dataProp] +
          data[i + 3][dataProp] +
          data[i + 4][dataProp] +
          data[i + 5][dataProp] +
          data[i + 6][dataProp]) / 7
      }
    }
    seriesArray.push({
      id: data[i].date,
      series: seriesName,
      group: data[i].dateChecked,
      value: data[i][dataProp]
    // label: i < 30 ? data[i][dataProp] : null
    })
    if (sma > -1) {
      seriesSMAArray.push({
        id: i,
        series: seriesSMAName,
        group: data[i].dateChecked,
        value: sma
      })
    }
  }
}

function preprocessData (data) {
  data.forEach(d => {
    if (!d.totalTestResultsIncrease)
      d.newPositivePct = 0
    else
      d.newPositivePct = Math.round(d.positiveIncrease / d.totalTestResultsIncrease * 1000) / 1000

    if (!d.positive)
      d.newPositivePctTotal = 0
    else
      d.newPositivePctTotal = Math.round(d.positiveIncrease / d.positive * 1000) / 1000

    if (!d.positive || d.death == null)
      d.deathRate = 0
    else
      d.deathRate = Math.round(d.death / d.positive * 1000) / 1000
  })
  return data
}
