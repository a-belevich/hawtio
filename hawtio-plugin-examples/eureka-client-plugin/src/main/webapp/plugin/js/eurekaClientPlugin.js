/**
 * @module EurekaClient
 * @mail EurekaClient
 *
 * The main entry point for the EurekaClient module
 *
 */
var EurekaClient = (function(EurekaClient) {

  /**
   * @property pluginName
   * @type {string}
   *
   * The name of this plugin
   */
  EurekaClient.pluginName = 'eureka_client_plugin';

  /**
   * @property log
   * @type {Logging.Logger}
   *
   * This plugin's logger instance
   */
  EurekaClient.log = Logger.get('EurekaClient');

  /**
   * @property contextPath
   * @type {string}
   *
   * The top level path of this plugin on the server
   *
   */
  EurekaClient.contextPath = "/eureka-client-plugin/";

  /**
   * @property templatePath
   * @type {string}
   *
   * The path to this plugin's partials
   */
  EurekaClient.templatePath = EurekaClient.contextPath + "plugin/html/";

  /**
   * @property module
   * @type {object}
   *
   * This plugin's angularjs module instance.  This plugin only
   * needs hawtioCore to run, which provides services like
   * workspace, viewRegistry and layoutFull used by the
   * run function
   */
  EurekaClient.module = angular.module('eureka_client_plugin', ['hawtioCore'])
      .config(function($routeProvider) {

        /**
         * Here we define the route for our plugin.  One note is
         * to avoid using 'otherwise', as hawtio has a handler
         * in place when a route doesn't match any routes that
         * routeProvider has been configured with.
         */
        $routeProvider
            .when('/eureka_client_plugin/list', {
              templateUrl: EurekaClient.templatePath + 'eurekaclient.html'
            })
            .when('/eureka_client_plugin/settings', {
              templateUrl: EurekaClient.templatePath + 'settings.html'
            });
      });

  /**
   * Here we define any initialization to be done when this angular
   * module is bootstrapped.  In here we do a number of things:
   *
   * 1.  We log that we've been loaded (kinda optional)
   * 2.  We load our .css file for our views
   * 3.  We configure the viewRegistry service from hawtio for our
   *     route; in this case we use a pre-defined layout that uses
   *     the full viewing area
   * 4.  We configure our top-level tab and provide a link to our
   *     plugin.  This is just a matter of adding to the workspace's
   *     topLevelTabs array.
   */
  EurekaClient.module.run(function(workspace, viewRegistry, layoutFull) {

    EurekaClient.log.info(EurekaClient.pluginName, " loaded");

    Core.addCSS(EurekaClient.contextPath + "plugin/css/eurekaclient.css");

    // tell the app to use the full layout, also could use layoutTree
    // to get the JMX tree or provide a URL to a custom layout
    viewRegistry["eureka_client_plugin"] = layoutFull;

    /* Set up top-level link to our plugin.  Requires an object
       with the following attributes:

         id - the ID of this plugin, used by the perspective plugin
              and by the preferences page
         content - The text or HTML that should be shown in the tab
         title - This will be the tab's tooltip
         isValid - A function that returns whether or not this
                   plugin has functionality that can be used for
                   the current JVM.  The workspace object is passed
                   in by hawtio's navbar controller which lets
                   you inspect the JMX tree, however you can do
                   any checking necessary and return a boolean
         href - a function that returns a link, normally you'd
                return a hash link like #/foo/bar but you can
                also return a full URL to some other site
         isActive - Called by hawtio's navbar to see if the current
                    $location.url() matches up with this plugin.
                    Here we use a helper from workspace that
                    checks if $location.url() starts with our
                    route.
     */
    workspace.topLevelTabs.push({
      id: "eurekaclient",
      content: "Eureka",
      title: "Eureka client plugin",
      isValid: function(workspace) { return true; },
      href: function() { return "#/eureka_client_plugin/list"; },
      isActive: function(workspace) { return workspace.isLinkActive("eureka_client_plugin"); }
      
    });

  });

  /**
   * @function EurekaClientController
   * @param $scope
   * @param jolokia
   *
   * The controller for eurekaclient.html, only requires the jolokia
   * service from hawtioCore
   *
   */
  EurekaClient.EurekaClientController = function($scope, jolokia) {
    $scope.hello = "Hello world!";
    $scope.cpuLoad = "0";

    // register a watch with jolokia on this mbean to
    // get updated metrics
    Core.register(jolokia, $scope, {
      type: 'read', mbean: 'java.lang:type=OperatingSystem',
      arguments: []
    }, onSuccess(render));

    // update display of metric
    function render(response) {
      $scope.cpuLoad = response.value['ProcessCpuLoad'];
      Core.$apply($scope);
    };

    $scope.buttonText = function() { return "Fetch"; };

    $scope.forms = {};

    $scope.formEntity = angular.fromJson(localStorage[EurekaClient.SETTINGS_KEY]) || {};
    $scope.formConfig = {
      properties: {
        host: {
          description: "Eureka Server Hostname",
          'type': 'java.lang.String',
          required: true
        },
        nickname: {
          description: "Eureka Server Nickname",
          'type': 'java.lang.String',
          required: true
        },
        ports: {
          description: 'Eureka Server Port',
          'type': 'Integer',
          tooltip: 'Comma separated list of ports to connect to, by default 6667 for non-SSL and 6697 for SSL connections are used'
        },
        useSSL: {
          description: 'SSL',
          'type': 'boolean'
        },
        autostart: {
          description: 'Connect at startup',
          'type': 'boolean',
          tooltip: 'Whether or not the Eureka connection should be started as soon as you log into hawtio'
        },
        channels: {
          description: 'Channels',
          'type': 'java.lang.String',
          tooltip: 'Space separated list of channels to connect to when the IRC connection is started'
        }
      }
    };

    $scope.$watch('formEntity', function(newValue, oldValue) {
      if (newValue !== oldValue) {
        localStorage[EurekaClient.SETTINGS_KEY] = angular.toJson(newValue);
      }
    }, true);

    $scope.connect = function() {
      if ($scope.forms.settings.$valid) {
        EurekaClientService.connect($scope.formEntity);
      }
    };
    
  };

  return EurekaClient;

})(EurekaClient || {});

// tell the hawtio plugin loader about our plugin so it can be
// bootstrapped with the rest of angular
hawtioPluginLoader.addModule(EurekaClient.pluginName);
