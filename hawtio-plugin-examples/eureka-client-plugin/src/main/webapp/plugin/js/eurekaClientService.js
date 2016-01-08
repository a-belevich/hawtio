/**
 * @module IRC
 */
var EurekaClient = (function(EurekaClient) {

  EurekaClient.SERVER = 'Server Messages';

  // The EurekaClient service handles the connection to
  // the server in the background
  EurekaClient.module.factory("EurekaClientService", function(jolokia, $rootScope) {
    var self = {

      error: function(line) {
        if (line.num) {
          IRC.log.debug("error - num: ", line.num, " message: ", line.message);
        } else {
          IRC.log.debug("error - message: ", line.message);
        }
      },

      connect: function(options) {
        self.options = options;
        EurekaClient.log.debug("Connecting to IRC service: ", options.host);


      $.ajax({
        type: 'GET'
      , url: options.host
      , dataType: 'json'
      })

        jolokia.request({
          type: 'exec',
          mbean: IRC.mbean,
          operation: 'connect',
          arguments: [options]
        }, {
          method: 'POST',
          success: function(response) {
            IRC.log.debug("Got response: ", response);
            IRC.log.debug("Connected, registering callback");
            self.handle = jolokia.register({
              method: 'POST',
              success: function(response) {
                self.dispatch(response);
              },
              error: function(response) {
                EurekaClient.log.info("Error fetching: ", response.error);
                EurekaClient.log.debug("stack trace: ", response.stacktrace);
                jolokia.unregister(self.handle);
                self.handle = undefined;
                self.executeDisconnectActions();
                Core.$apply($rootScope);
              }
            }, {
              type: 'exec',
              mbean: EurekaClient.mbean,
              operation: 'fetch',
              arguments: []
            });
            self.executeConnectActions();
          },
          error: function(response) {
            IRC.log.warn("Failed to connect to server: ", response.error);
            IRC.log.info("Stack trace: ", response.stacktrace);
          }
        });
      }
    };

    return self;
  });

  return IRC;
}(IRC || {}));
