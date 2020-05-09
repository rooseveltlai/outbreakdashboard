/*
 * Your application specific code will go here
 */
define(['knockout', 'ojs/ojmodule-element-utils', 'ojs/ojresponsiveutils', 'ojs/ojresponsiveknockoututils', 'ojs/ojrouter', 'ojs/ojarraydataprovider', 'ojs/ojknockouttemplateutils', 'ojs/ojmodule-element', 'ojs/ojknockout', 'ojs/ojprogress'],
  function (ko, moduleUtils, ResponsiveUtils, ResponsiveKnockoutUtils, Router, ArrayDataProvider, KnockoutTemplateUtils) {
    function ControllerViewModel () {
      var self = this

      self.KnockoutTemplateUtils = KnockoutTemplateUtils

      // Handle announcements sent when pages change, for Accessibility.
      self.manner = ko.observable('polite')
      self.message = ko.observable()
      document.getElementById('globalBody').addEventListener('announce', announcementHandler, false)

      function announcementHandler (event) {
        setTimeout(function () {
          self.message(event.detail.message)
          self.manner(event.detail.manner)
        }, 200)
      }

      // Media queries for repsonsive layouts
      var smQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY)
      self.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery)

      // Router setup
      self.router = Router.rootInstance
      self.router.configure({
        'cases': {label: 'Cases', isDefault: true},
        'dashboard': {label: 'Dashboard', isDefault: false},
        'trends': {label: 'Trends', isDefault: false}
      })
      Router.defaults['urlAdapter'] = new Router.urlParamAdapter()

      self.loadModule = function () {
        self.moduleConfig = ko.pureComputed(function () {
          var name = self.router.moduleConfig.name()
          var viewPath = 'views/' + name + '.html'
          var modelPath = 'viewModels/' + name

          setCookie('outbreak_bookmark', name, 365)

          return moduleUtils.createConfig({ viewPath: viewPath,
          viewModelPath: modelPath, params: { parentRouter: self.router } })
        })
      }

      // Navigation setup
      var navData = [
        {name: 'Cases', id: 'cases',
        iconClass: 'oj-navigationlist-item-icon demo-icon-font-24 demo-library-icon-24'},
        {name: 'Trends', id: 'trends',
        iconClass: 'oj-navigationlist-item-icon demo-icon-font-24 demo-fire-icon-24'},
        {name: 'Dashboard', id: 'dashboard',
        iconClass: 'oj-navigationlist-item-icon demo-icon-font-24 demo-chart-icon-24'}
      ]
      self.navDataProvider = new ArrayDataProvider(navData, {keyAttributes: 'id'})

      // Header
      // Application Name used in Branding Area
      self.appName = ko.observable('Corona Virus Outbreak Dashboard')
      self.lastUpd = ko.observable()
      self.loading = ko.observable(true)

      // Footer
      function footerLink (name, id, linkTarget) {
        this.name = name
        this.linkId = id
        this.linkTarget = linkTarget
      }
      self.footerLinks = ko.observableArray([])

      let savedUrl = getCookie('outbreak_bookmark')
      if (savedUrl && self.router.moduleConfig.name() !== savedUrl) {
        setTimeout(function () {self.router.go(savedUrl)}, 20)
      }
    }

    function setCookie (name, value, days) {
      var expires = ''
      if (days) {
        var date = new Date()
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
        expires = '; expires=' + date.toUTCString()
      }
      document.cookie = name + '=' + (value || '') + expires + '; path=/'
    }

    function getCookie (name) {
      var nameEQ = name + '='
      var ca = document.cookie.split(';')
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i]
        while (c.charAt(0) == ' ') c = c.substring(1, c.length)
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length)
      }
      return null
    }

    return new ControllerViewModel()
  }
)
