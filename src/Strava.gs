//
// Strava.gs
// ===============================================================================================
// A small API for Strava's web service

//
var Strava = (function() {
  var base = 'https://www.strava.com/api/v3/';
  var tokenUrl = 'https://www.strava.com/oauth/token';
  
  // Public methods and attributes
  // ---------------------------------------------------------------------------------------------
  
  this.service = getService_();
  
  this.getActivity = function(id) {
    // Get an individual activity by Strava activity ID.
    //
    // Params:
    //   - id {String}: The activity identification number assigned by Strava.
    //
    var url = base + 'activities/' + id;
    var res = fetch(url);
    var body = JSON.parse(res.getContentText());
    return body;
  };
  
  this.getActivitiesList = function(opts) {
    // Get all Strava activities from an authenticated athlete
    // https://developers.strava.com/docs/reference/#api-Activities-getLoggedInAthleteActivities  
    //
    // Params:
    //   - opts {object literal}: A dictionary of all Strava endpoint parameters listed at URL
    //     listed above.
    //
    var validParams = ['per_page', 'after', 'before', 'page'];
    var code;
  
    var url = base + 'athlete/activities?';
  
    url += validParams.filter(function(p) {
      return opts.hasOwnProperty(p);
    }).map(function(p) {
      return p + '=' + opts[p];
    }).join('&');
   
    var res = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      },
      muteHttpExceptions: false
    });
    
    return res;
  
  };     
  
  this.getActivityStreams = function(id, keys) {
    // (WIP) get streams for a specific activity by activity ID
    //
    // Params:
    //   - id {String} the unique ID of the activity provided by Strava
    //   - keys {Array of Strings} one of the valid stream types defined by Strava. 
    //     See a complete list of valid keys at: https://developers.strava.com/docs/reference/#api-models-StreamSet
    //
    if (!Array.isArray(keys)) {
      throw "getActivityStreams expects an array in the keys argument"
    }
    
    var url = base + "activities/" + id + '/streams?keys=' + keys.join(',');
    var res = fetch(url);
    var body = JSON.parse(res.getContentText());
    
    return body;
  }
  
  this.authorize = function() {
    var authorizationUrl = this.service.getAuthorizationUrl();
    Logger.log('Authorization URL: \n%s\n\n', this.service.getAuthorizationUrl());
    throw new Error("Check Logger for authorization URL");
  }

  return this;
  
  // Private helper functions
  // ---------------------------------------------------------------------------------------------
  
//  function authenticate() {
//    var service = getService_();
//    if (service.hasAccess()) {
//      var url = 'https://www.strava.com/api/v3/activities';
//      var response = UrlFetchApp.fetch(url, {
//        headers: {
//          Authorization: 'Bearer ' + service.getAccessToken()
//        }
//      });
//      var result = JSON.parse(response.getContentText());
//      Logger.log(JSON.stringify(result, null, 2));
//    } else {
//      var authorizationUrl = service.getAuthorizationUrl();
//      Logger.log('Open the following URL and re-run the script: %s',
//          authorizationUrl);
//    }
//  }

  /**
   * Configures the service.
   * Three required and optional parameters are not specified
   * because the library creates the authorization URL with them
   * automatically: `redirect_url`, `response_type`, and
   * `state`.
   */
  function getService_() {
    return OAuth2.createService('Strava')
        // Set the endpoint URLs.
        .setAuthorizationBaseUrl('https://www.strava.com/oauth/authorize')
        .setTokenUrl(tokenUrl)
  
        // Set the client ID and secret.
        .setClientId(CLIENT_ID)
        .setClientSecret(CLIENT_SECRET)
        
        .setParam('scope', 'activity:read_all')
  
        // Set the name of the callback function that should be invoked to
        // complete the OAuth flow.
        .setCallbackFunction('authCallback_')
  
        // Set the property store where authorized tokens should be persisted.
        .setPropertyStore(PropertiesService.getUserProperties());
  }

  /**
   * Logs the redict URI to register.
   */
  function logRedirectUri() {
    Logger.log(OAuth2.getRedirectUri());
  }
  
  function fetch(url) {
    // Make a request to the Strava API
    var service = getService_();
    if (service.hasAccess()) {
      var res = UrlFetchApp.fetch(url, {
        headers: {
          Authorization: 'Bearer ' + service.getAccessToken()
        }
      });
      return res;
    } else {
      // Need to authorize
      this.authorize();
    }
  }
  
})();