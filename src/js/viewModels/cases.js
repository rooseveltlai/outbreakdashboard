/*
 * Your dashboard ViewModel code goes here
 */
define(['../appController', 'knockout', 'jquery', 'ojs/ojbootstrap', 'ojs/ojarraydataprovider', 'ojs/ojlistdataproviderview', 'ojs/ojknockout', 'ojs/ojchart', 'ojs/ojtable'],
  function (app, ko, $, Bootstrap, ArrayDataProvider, ListDataProviderView, DateTimeConverter) {
    function TableDataViewModel () {
      var self = this
      self.tableData = ko.observableArray()

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
        document.title = 'Case in US and States - Coronavirus Outbreak Dashboard'
        loadTableData()
      }

      self.tableDataProvider = new ArrayDataProvider(self.tableData,
        {
          keyAttributes: 'stateName',
          implicitSort: [{ attribute: 'deltaPositive', direction: 'descending' }]
        }
      )

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

      function loadTableData () {
        app.loading(true)

        let url = `/api/v1/states/daily.json`
        let promise1 = $.getJSON(url)

        let usUrl = `/api/v1/us/daily.json`
        let promise2 = $.getJSON(usUrl)

        $.when(promise1, promise2).then(function (dataState, dataUSA) {
          let usa = dataUSA[0].map(i => {
            i.state = 'USA'
            return i
          })
          data = preprocessData(dataState[0].concat(usa))
          self.tableData(data)
          app.loading(false)
        })
      }

      function preprocessData (data) {
        let currentDate = data[0].date
        app.lastUpd(dateToISO(currentDate))

        let prevDate = data.find(i => i.date < currentDate).date
        let latestDayData = data.filter(i => i.date == currentDate)
        let priorDayData = data.filter(i => i.date == prevDate)

        let priorDayMap = {}
        priorDayData.forEach(i => priorDayMap[i.state] = i)

        let dailyPositiveMap = {}
        data.forEach(i => {
          let series = dailyPositiveMap[i.state] || []
          series.unshift(i.positiveIncrease)
          dailyPositiveMap[i.state] = series
        })

        return latestDayData.map(i => {
          let prior = priorDayMap[i.state]
          i.deltaPositive = i.positive - prior.positive
          i.deltaDeath = i.death - prior.death
          i.deltaTest = i.totalTestResults - prior.totalTestResults

          if (i.deltaTest && i.deltaPositive < i.deltaTest) {
            i.posTestRate = Math.round(i.deltaPositive / i.deltaTest * 1000)
            i.posTestRateStr = (Math.round(i.deltaPositive / i.deltaTest * 1000) / 10) + '%'
          } else {
            i.posTestRate = 0
            i.posTestRateStr = '-'
          }

          if (i.totalTestResults && i.positive < i.totalTestResults) {
            i.totalPosTestRate = Math.round(i.positive / i.totalTestResults * 1000)
            i.totalPosTestRateStr = (Math.round(i.positive / i.totalTestResults * 1000) / 10) + '%'
          } else {
            i.totalPosTestRate = 0
            i.totalPosTestRateStr = '-'
          }

          if (i.positive && i.death < i.positive) {
            i.deathRate = Math.round(i.death / i.positive * 1000)
            i.deathRateStr = (Math.round(i.death / i.positive * 1000) / 10) + '%'
          } else {
            i.deathRate = 0
            i.deathRateStr = '-'
          }

          i.series = dailyPositiveMap[i.state]
          i.stateName = STATES[i.state]
          i.spark = new ArrayDataProvider(i.series)

          return i
        }).sort((a, b) => b.deltaPositive - a.deltaPositive)
      }

      function dateToISO (date) {
        let dateStr = date.toString()
        return dateStr.substring(0, 4) + '-' + dateStr.substring(4, 6) + '-' + dateStr.substring(6, 8)
      }
    }

    var STATES = {
      'USA': 'United States',
      'AL': 'Alabama',
      'AK': 'Alaska',
      'AS': 'American Samoa',
      'AZ': 'Arizona',
      'AR': 'Arkansas',
      'CA': 'California',
      'CO': 'Colorado',
      'CT': 'Connecticut',
      'DE': 'Delaware',
      'DC': 'District Of Columbia',
      'FM': 'Federated States Of Micronesia',
      'FL': 'Florida',
      'GA': 'Georgia',
      'GU': 'Guam',
      'HI': 'Hawaii',
      'ID': 'Idaho',
      'IL': 'Illinois',
      'IN': 'Indiana',
      'IA': 'Iowa',
      'KS': 'Kansas',
      'KY': 'Kentucky',
      'LA': 'Louisiana',
      'ME': 'Maine',
      'MH': 'Marshall Islands',
      'MD': 'Maryland',
      'MA': 'Massachusetts',
      'MI': 'Michigan',
      'MN': 'Minnesota',
      'MS': 'Mississippi',
      'MO': 'Missouri',
      'MT': 'Montana',
      'NE': 'Nebraska',
      'NV': 'Nevada',
      'NH': 'New Hampshire',
      'NJ': 'New Jersey',
      'NM': 'New Mexico',
      'NY': 'New York',
      'NC': 'North Carolina',
      'ND': 'North Dakota',
      'MP': 'Northern Mariana Islands',
      'OH': 'Ohio',
      'OK': 'Oklahoma',
      'OR': 'Oregon',
      'PW': 'Palau',
      'PA': 'Pennsylvania',
      'PR': 'Puerto Rico',
      'RI': 'Rhode Island',
      'SC': 'South Carolina',
      'SD': 'South Dakota',
      'TN': 'Tennessee',
      'TX': 'Texas',
      'UT': 'Utah',
      'VT': 'Vermont',
      'VI': 'Virgin Islands',
      'VA': 'Virginia',
      'WA': 'Washington',
      'WV': 'West Virginia',
      'WI': 'Wisconsin',
      'WY': 'Wyoming'
    }

    /*
     * Returns an instance of the ViewModel providing one instance of the ViewModel. If needed,
     * return a constructor for the ViewModel so that the ViewModel is constructed
     * each time the view is displayed.
     */
    return TableDataViewModel
  }
)
