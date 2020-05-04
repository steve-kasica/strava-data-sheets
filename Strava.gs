//
// Strava.gs
// ===============================================================================================
// A small API for Strava's web service

//
var Strava = (function(service) {
  var base = 'https://www.strava.com/api/v3/';
  var accessToken = service.getAccessToken();
  
  // Public methods
  // ---------------------------------------------------------------------------------------------
  
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
        Authorization: 'Bearer ' + accessToken
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

  return this;
  
  // Private helper functions
  // ---------------------------------------------------------------------------------------------
  
  function fetch(url) {
    // Make a request to the Strava API
    //
    var service = getService_();
    return UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      }
    });
  }
  
})(getService_());