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
        document.title = 'Trends - Coronavirus Outbreak Dashboard'
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
        let saved = getCookie('outbreak_states')
        if (saved) 
          saved = JSON.parse(saved)
        else
          saved = ['CA', 'TX', 'FL']
        self.stateSelected(saved)
      }

      self.movingAverageEnabled.subscribe(function(val) {
        setTimeout(function() {
          self.stateSelected().forEach(s => {
            clearState(s)
            renderChartsByState(s, val)
          })
        }, 10)
      })  

      self.valueChangedHandler = function (event) {

        let prev = event.detail.previousValue
        let states = event.detail.value

        setCookie('outbreak_states', JSON.stringify(states), 356);

        if (prev && prev.length > 0) {
          removed = prev.filter(s => states.indexOf(s) < 0)
          if (removed) removed.forEach(s => clearState(s))
        }

        added = states.filter(s => prev.indexOf(s) < 0)
        redrawStates(added)
      }

      var clearState = function (state) {
        self.DataDailyNewCases.remove( d => {return d.series.startsWith(state)})
        self.DataDailyNewCases.remove(d => { return d.series.startsWith(state) })
        self.DataDailyNewCasePct.remove(d => { return d.series.startsWith(state) })
        self.DataDailyNewDeath.remove(d => { return d.series.startsWith(state) })
        self.DataDailyTests.remove(d => { return d.series.startsWith(state) })
        self.DataDeathRate.remove(d => { return d.series.startsWith(state) })
        self.DataTotalCases.remove(d => { return d.series.startsWith(state) })
        self.DataTotalTests.remove(d => { return d.series.startsWith(state) })
        self.DataTotalDeath.remove(d => { return d.series.startsWith(state) })
      }

      var redrawStates = function (states) {
        app.loading(true)
        let promises = []
        states.forEach(s => promises.push(loadCharts(s)))

        $.when.apply(null, promises).done(function() {
          app.loading(false)
        })
      }

      self.onClickHandler = function (event) {
        setTimeout(function () { $('#selectRegion input').select() }, 50)
      }

      function loadState () {
        $.getJSON('/api/v1/states/info.json', function (data) {
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
        let url = `/api/v1/${state != 'US' ? ('states.toLowerCase()/' + state.toLowerCase()) : 'us'}/daily.json`
        return $.getJSON(url, function (data) {
          let dailyNewCases = []
          let dailyNewTests = []
          let dailyNewCasePct = []
          let dailyNewDeath = []
          let dailyDeathRate = []
          let totalCases = []
          let totalTests = []
          let totalDeath = []

          console.time('loadCharts-' + state)

          data = preprocessData(data)
          extractChartData(data, 'positiveIncrease', dailyNewCases, state + ' Daily New Cases', state + ' 7 Day Moving Average')
          extractChartData(data, 'totalTestResultsIncrease', dailyNewTests, state + ' Daily New Tests', state + ' 7 Day Moving Average')
          extractChartData(data, 'newPositivePct', dailyNewCasePct, state + ' Daily New Cases / New Tests', state + ' 7 Day Moving Average')
          extractChartData(data, 'deathIncrease', dailyNewDeath, state + ' Daily New Death', state + ' 7 Day Moving Average')
          extractChartData(data, 'deathRate', dailyDeathRate, state + ' Death Rate', state + ' 7 Day Moving Average')
          extractChartData(data, 'positive', totalCases, state + ' Total Cases', state + ' 7 Day Moving Average')
          extractChartData(data, 'totalTestResults', totalTests, state + ' Total Tests', state + ' 7 Day Moving Average')
          extractChartData(data, 'death', totalDeath, state + ' Total Death', state + ' 7 Day Moving Average')

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

          renderChartsByState(state)

          console.timeEnd("loadCharts-" + state)
        })
      }


      var renderChartsByState = function(state, movingAvg) {
        let mv = movingAvg == undefined ? self.movingAverageEnabled() : movingAvg
        let col = mv ? 1 : 0
        ko.utils.arrayPushAll(self.DataDailyNewCases, self.chartDataDailyNewCases[state][col])
        ko.utils.arrayPushAll(self.DataDailyNewCasePct, self.chartDataDailyNewCasePct[state][col])
        ko.utils.arrayPushAll(self.DataDailyNewDeath, self.chartDataDailyNewDeath[state][col])
        ko.utils.arrayPushAll(self.DataDailyTests, self.chartDataDailyTests[state][col])
        ko.utils.arrayPushAll(self.DataDeathRate, self.chartDataDeathRate[state][col])
        ko.utils.arrayPushAll(self.DataTotalCases, self.chartDataTotalCases[state][col])
        ko.utils.arrayPushAll(self.DataTotalTests, self.chartDataTotalTests[state][col])
        ko.utils.arrayPushAll(self.DataTotalDeath, self.chartDataTotalDeath[state][col])
      }

      /////////////////// utilies //////////////////

      var EarliestDate = {}
      var EarliestDateSMA = {}

      function dateToISO(date) {
        let dateStr = date.toString()
        return dateStr.substring(0, 4) + '-' + dateStr.substring(4, 6) + '-' + dateStr.substring(6, 8)
      }

      function extractChartData(data, dataProp, seriesArray, seriesName, seriesSMAName) {
        let i = data.length
        let earliest = 30000000
        let earliestSMA = 30000000

        seriesArray[0] = []
        seriesArray[1] = []

        for (let i = data.length - 1; i >= 0; i--) {
          if (data[i][dataProp] == null || !data[i].date) continue

          // a bug in OJET can't have data earlier than the first series of data shown
          // we throw away any data earlier than the earliest of first series

          let sma = -1
          if (i < data.length - 6) {
            if (typeof data[i + 1][dataProp] == 'number' && typeof data[i + 2][dataProp] == 'number' && typeof data[i + 3][dataProp] == 'number' && typeof data[i + 4][dataProp] == 'number'
                  && typeof data[i + 5][dataProp] == 'number' && typeof data[i + 6][dataProp] == 'number'){
              sma = (data[i][dataProp] +
                data[i + 1][dataProp] +
                data[i + 2][dataProp] +
                data[i + 3][dataProp] +
                data[i + 4][dataProp] +
                data[i + 5][dataProp] +
                data[i + 6][dataProp]) / 7
            }
          }

          if (EarliestDate[dataProp] == undefined || data[i]['date'] >= EarliestDate[dataProp]) {
            if (data[i]['date'] < earliest) earliest = data[i]['date']
            seriesArray[0].push({
              id: data[i].hash,
              series: seriesName,
              group: dateToISO(data[i].date) + 'T12:00:00Z',
              value: data[i][dataProp],
              label: i == 0 ? seriesName.split(' ')[0] : null
            })
          }

          if (sma > -1) {
            if (EarliestDateSMA[dataProp] == undefined || data[i]['date'] >= EarliestDateSMA[dataProp]) {
              if (data[i]['date'] < earliestSMA) earliestSMA = data[i]['date']
              seriesArray[1].push({
                id: data[i].hash,
                series: seriesSMAName,
                group: dateToISO(data[i].date) + 'T12:00:00Z',
                value: sma,
                label: i == 0 ? seriesSMAName.split(' ')[0] : null
              })
            }
          }
        }

        if (EarliestDate[dataProp] == undefined) EarliestDate[dataProp] = earliest
        if (EarliestDateSMA[dataProp] == undefined) EarliestDateSMA[dataProp] = earliestSMA
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

      function setCookie(name, value, days) {
        var expires = "";
        if (days) {
          var date = new Date();
          date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
          expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
      }

      function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) == ' ') c = c.substring(1, c.length);
          if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
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
