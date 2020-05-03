define(['../appController','knockout', 'jquery', 'ojs/ojbootstrap', 'ojs/ojarraydataprovider', 'ojs/ojconverter-datetime', 
          'ojs/ojknockout', 'ojs/ojchart', 'ojs/ojselectcombobox', 'ojs/ojswitch'],
  function (app, ko, $, Bootstrap, ArrayDataProvider, DateTimeConverter) {

    function DashboardViewModel () {
      var self = this

      self.movingAverageEnabled = ko.observable(true)

      self.chartDataDailyNewCases = {}
      self.DataDailyNewCases = ko.observableArray()

      self.chartDataDailyTests = {}
      self.DataDailyTests = ko.observableArray()

      self.chartDataDailyNewCasePct = {}
      self.DataDailyNewCasePct = ko.observableArray()

      self.chartDataDailyNewCasePctTotal = {}
      self.DataDailyNewCasePctTotal = ko.observableArray()

      self.chartDataDailyNewDeath = {}
      self.DataDailyNewDeath = ko.observableArray()

      self.chartDataDeathRate = {}
      self.DataDeathRate = ko.observableArray()

      self.chartDataDailyNewDeath = {}
      self.DataDailyNewDeath = ko.observableArray()

      self.chartDataTotalCases = {}
      self.DataTotalCases = ko.observableArray()

      self.chartDataTotalTests = {}
      self.DataTotalTests = ko.observableArray()

      self.chartDataTotalDeath = {}
      self.DataTotalDeath = ko.observableArray()

      self.xAxisOptions = ko.observable({})
      self.xAxisOptions2 = ko.observable({})

      self.latestData = ko.observable()

      self.states = ko.observableArray()
      self.stateSelected = ko.observableArray()

      var dateOptions = { day: 'numeric', month: 'numeric' }
      self.dayMonth = new DateTimeConverter.IntlDateTimeConverter(dateOptions)
      self.xAxisOptions({
        tickLabel: { converter: [ko.toJS(self.dayMonth)], style: 'font-size:10px' }
      })
      self.xAxisOptions2({
        tickLabel: { converter: [ko.toJS(self.dayMonth)], style: 'font-size:10px' }
      })
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
        document.title = 'Trends'
        loadState()
      }

      self.dataProviderDailyNewCases = new ArrayDataProvider(self.DataDailyNewCases, { keyAttributes: 'id' })
      self.dataProviderDailyNewTests = new ArrayDataProvider(self.DataDailyTests, { keyAttributes: 'id' })
      self.dataProviderDailyNewCasePct = new ArrayDataProvider(self.DataDailyNewCasePct, { keyAttributes: 'id' })
      self.dataProviderDailyNewCasePctTotal = new ArrayDataProvider(self.DataDailyNewCasePctTotal, { keyAttributes: 'id' })
      self.dataProviderDailyNewDeath = new ArrayDataProvider(self.DataDailyNewDeath, { keyAttributes: 'id' })
      self.dataProviderDeathRate = new ArrayDataProvider(self.DataDeathRate, { keyAttributes: 'id' })
      self.dataProviderTotalCases = new ArrayDataProvider(self.DataTotalCases, { keyAttributes: 'id' })
      self.dataProviderTotalTests = new ArrayDataProvider(self.DataTotalTests, { keyAttributes: 'id' })
      self.dataProviderTotalDeath = new ArrayDataProvider(self.DataTotalDeath, { keyAttributes: 'id' })

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
      self.transitionCompleted = function () {
        self.stateSelected(['CA','TX','FL','IL','WA', 'GA'])
      }

      self.latestValue = ko.pureComputed(function () {
        let size = self.chartDataDailyNewCases().length
        if (size) {
          return self.chartDataDailyNewCases()[size - 1].value
        } else {
          return 0
        }
      })

      self.movingAverageEnabled.subscribe(function() {
        redrawStates(self.stateSelected())
      })

      self.valueChangedHandler = function (event) {
        let states = event.detail.value
        redrawStates(states)
      }

      redrawStates = function (states) {
        app.loading(true)

        self.DataDailyNewCases.removeAll()
        self.chartDataDailyNewCases = {}
        
        self.chartDataDailyTests = {}
        self.DataDailyTests.removeAll()

        self.chartDataDailyNewCasePct = {}
        self.DataDailyNewCasePct.removeAll()

        self.chartDataDailyNewDeath = {}
        self.DataDailyNewDeath.removeAll()

        self.chartDataDeathRate = {}
        self.DataDeathRate.removeAll()

        self.chartDataTotalCases = {}
        self.DataTotalCases.removeAll()

        self.chartDataTotalTests = {}
        self.DataTotalTests.removeAll()

        self.chartDataTotalDeath = {}
        self.DataTotalDeath.removeAll()

        let promises = []
        states.forEach(s => promises.push(loadCharts(s)))

        let compare = function (a, b) {
          if (a.date > b.date) return 1;
          if (b.date > a.date) return -1;
          return 0;
        }

        let sortSeries = function (series) {
          let arr = []
          for (p in series) {
            arr.push({state: p, date: series[p][0].group})
          }
          return arr.sort(compare)
        }

        let copySeriesByOrder = function (observable, seriesObj) {
          let sortedStates = sortSeries(seriesObj)
          sortedStates.forEach(s => {
            ko.utils.arrayPushAll(observable, seriesObj[s.state])
          })
        }


        $.when.apply(null, promises).done(function() {
          copySeriesByOrder(self.DataDailyNewCases, self.chartDataDailyNewCases)
          copySeriesByOrder(self.DataDailyNewCasePct, self.chartDataDailyNewCasePct)
          copySeriesByOrder(self.DataDailyNewDeath, self.chartDataDailyNewDeath)
          copySeriesByOrder(self.DataDailyTests, self.chartDataDailyTests)
          copySeriesByOrder(self.DataDeathRate, self.chartDataDeathRate)
          copySeriesByOrder(self.DataTotalCases, self.chartDataTotalCases)
          copySeriesByOrder(self.DataTotalTests, self.chartDataTotalTests)
          copySeriesByOrder(self.DataTotalDeath, self.chartDataTotalDeath)
          app.loading(false)
        })
      }

      self.onClickHandler = function (event) {
        setTimeout(function () { $('#selectRegion input').select() }, 50)
      }

      function loadState () {
        $.getJSON('https://covidtracking.com/api/v1/states/info.json', function (data) {
          let stateList = []
          stateList.push({
            value: 'US',
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
        let url = `https://covidtracking.com/api/v1/${state != 'US' ? ('states/' + state) : 'us'}/daily.json`
        return $.getJSON(url, function (data) {
          let dailyNewCases = []
          let dailyNewTests = []
          let dailyNewCasePct = []
          let dailyNewDeath = []
          let dailyDeathRate = []
          let totalCases = []
          let totalTests = []
          let totalDeath = []

          data = preprocessData(data)
          extractChartData(data, 'positiveIncrease', dailyNewCases, state + ' Daily New Cases', state + ' 5 Day Moving Average')
          extractChartData(data, 'totalTestResultsIncrease', dailyNewTests, state + ' Daily New Tests', state + ' 5 Day Moving Average')
          extractChartData(data, 'newPositivePct', dailyNewCasePct, state + ' Daily New Cases / New Tests', state + ' 5 Day Moving Average')
          extractChartData(data, 'deathIncrease', dailyNewDeath, state + ' Daily New Death', state + ' 5 Day Moving Average')
          extractChartData(data, 'deathRate', dailyDeathRate, state + ' Death Rate', state + ' 5 Day Moving Average')
          extractChartData(data, 'positive', totalCases, state + ' Total Cases', state + ' 5 Day Moving Average')
          extractChartData(data, 'totalTestResults', totalTests, state + ' Total Tests', state + ' 5 Day Moving Average')
          extractChartData(data, 'death', totalDeath, state + ' Total Death', state + ' 5 Day Moving Average')

          /* chart data */
          self.chartDataDailyNewCases[state] = dailyNewCases
          self.chartDataDailyTests[state] = dailyNewTests
          self.chartDataDailyNewCasePct[state] = dailyNewCasePct
          self.chartDataDailyNewDeath[state] = dailyNewDeath
          self.chartDataDeathRate[state] = dailyDeathRate
          self.chartDataTotalCases[state] = totalCases
          self.chartDataTotalTests[state] = totalTests
          self.chartDataTotalDeath[state] = totalDeath

          data[0].latestDate = dateToISO(data[0].date)
          self.latestData(data[0])
          app.lastUpd(data[0].latestDate)

          let today = new Date(Date.parse(data[0].dateChecked))
          let start = new Date()
          start.setDate(today.getDate() - 45)
          let start2 = new Date()
          start2.setDate(today.getDate() - 5)

          var dateOptions = { day: 'numeric', month: 'numeric' }
          self.dayMonth = new DateTimeConverter.IntlDateTimeConverter(dateOptions)
          self.xAxisOptions({
            tickLabel: { converter: [ko.toJS(self.dayMonth)], style: "font-size:10px" },
            viewportStartGroup: start,
            viewportEndGroup: today
          })

          self.xAxisOptions2({
            tickLabel: { converter: [ko.toJS(self.dayMonth)], style: "font-size:10px" },
            viewportStartGroup: start2,
            viewportEndGroup: today
          })
        })
      }


      /////////////////// utilies //////////////////

      var EarliestDate = {}

      function dateToISO(date) {
        let dateStr = date.toString()
        return dateStr.substring(0, 4) + '-' + dateStr.substring(4, 6) + '-' + dateStr.substring(6, 8)
      }

      function extractChartData(data, dataProp, seriesArray, seriesName, seriesSMAName) {
        let i = data.length
        let earliest = 30000000
        for (let i = data.length - 1; i >= 0; i--) {
          if (data[i][dataProp] == null) continue

          // a bug in OJET can't have data earlier than the first series of data shown
          // we throw away any data earlier than the earliest of first series

          let sma = -1
          if (i < data.length - 4) {
            if (typeof data[i + 1][dataProp] == 'number' && typeof data[i + 2][dataProp] == 'number' && typeof data[i + 3][dataProp] == 'number' && typeof data[i + 4][dataProp] == 'number') {
              sma = (data[i][dataProp] +
                data[i + 1][dataProp] +
                data[i + 2][dataProp] +
                data[i + 3][dataProp] +
                data[i + 4][dataProp]) / 5
            }
          }

          if (!self.movingAverageEnabled()) {
            //if (EarliestDate[dataProp] != undefined && data[i]['date'] < EarliestDate[dataProp]) continue
            //if (data[i]['date'] < earliest) earliest = data[i]['date']
            seriesArray.push({
              id: data[i].hash,
              series: seriesName,
              group: dateToISO(data[i].date) + 'T12:00:00Z',
              value: data[i][dataProp],
              label: i == 0 ? seriesName.split(' ')[0] : null
            })
          } else {
            if (sma > -1) {
              //if (EarliestDate[dataProp] != undefined && data[i]['date'] < EarliestDate[dataProp]) continue
              //if (data[i]['date'] < earliest) earliest = data[i]['date']
              seriesArray.push({
                id: data[i].hash,
                series: seriesSMAName,
                group: dateToISO(data[i].date) + 'T12:00:00Z',
                value: sma,
                label: i == 0 ? seriesSMAName.split(' ')[0] : null
              })
            }
          }
        }

        //if (EarliestDate[dataProp] == undefined) EarliestDate[dataProp] = earliest
      }

      function preprocessData(data) {
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

    }

    /*
     * Returns an instance of the ViewModel providing one instance of the ViewModel. If needed,
     * return a constructor for the ViewModel so that the ViewModel is constructed
     * each time the view is displayed.
     */
    return DashboardViewModel
  }
)
