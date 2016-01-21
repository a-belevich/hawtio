/**
 * @module EurekaClient
 */
var EurekaClient = (function(EurekaClient) {
	EurekaClient.SERVER = 'Server Messages';
// The EurekaClient service handles the connection to
// the server in the background
	EurekaClient.module.factory("EurekaClientService", function(jolokia, $rootScope) {
		var self = {
			error: function(line) {
				if (line.num) {
					EurekaClient.log.debug("error - num: ", line.num, " message: ", line.message);
				} else {
					EurekaClient.log.debug("error - message: ", line.message);
				}
			},

			render: function(xml) {
//				EurekaClient.log.info(EurekaClient.pluginName, xml);
				var connections = [];

				connections.add({
					scheme: 'http',
					host: self.options.host,
					port: self.options.port,
					path: "jolokia",
					useProxy: true,
					jolokiaUrl: null,
					userName: null,
					password: null,
					view: null,
					name: self.options.nickname
				});

				$(xml).find('application').each(function() {
					connections.add({
						scheme: 'http',
						host: $(this).find("hostName").text(),
						port: $(this).find("port").text(),
						path: "jolokia",
						useProxy: true,
						jolokiaUrl: null,
						userName: null,
						password: null,
						view: null,
						name: $(this).find("instanceId").text()
					});
				});

				Core.clearConnections();

				var names = [];
				connections.each(function(connection) { 
					Core.saveConnection(connection); 
					names.push(connection.name);
				});

				Core.getLocalStorage()["recentConnections"] = angular.toJson(names);
				
				Core.notification('info', "Successfully fetched list of servers from Eureka.");
				Core.$apply($rootScope);
			},

			renderError: function(response) {
				EurekaClient.log.info(EurekaClient.pluginName, " error " + response);
				Core.notification('error', response.error);
				Core.$apply($rootScope);
			},

			connect: function(options) {
				self.options = options;
				EurekaClient.log.debug("Connecting to Eureka service: ", options.host);
				
				var url = "http://" + options.host + ":" + options.port + "/eureka/apps";
				
				jolokia.request({
					type: 'exec',
					mbean: EurekaClient.mbean,
					operation: 'fetch',
					arguments: [url]
				}, {
					method: 'POST',
					success: function(response) {
						self.render(response.value);
					},
					error: function(response) {
						self.renderError(response);
					},
				});
			}
	};

    return self;
  });

  return EurekaClient;
}(EurekaClient || {}));
