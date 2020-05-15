//
// Activity_.gs
// ===================================================================================================================
// A class for representing Strava Activities as rows in the spreadsheet
//

var Activity_ = function(activity) {
  // Initialization expects an object with the following properties:
  //   - start_date_local
  //   - type
  //   - distance
  //   - elapsed_time
  //   - moving_time
  //   - total_elevation_gain
  //   - id
  //   - workout_type
  //   - commute

  var self = this;

  self.columns = DATA_VARIABLES;
  
  if (Array.isArray(activity)) {
    self.properties = initFromRow(activity);
  } else {
    self.properties = initFromStrava(activity);
  }
    
  this.toRow = function() {
    // Export activity as an array
    return this.columns.map(function(col){ return self.properties[col]; });
  }
  
  this.merge = function(act) {
    // Combines two instances of Activity into one instance
    
    if (self.properties[self.columns[1]] !== act.properties[act.columns[1]]) {
      throw "ActivityType mismatch while merging activities";
    } else if (self.properties[self.columns[10]] === 'Race' || act.properties[act.columns[10]] === 'Race') {
      throw "Can't merge races";
    }
    
    self.properties[self.columns[2]] += act.properties[act.columns[2]];  // DistanceMeters
    self.properties[self.columns[3]] += act.properties[act.columns[3]];  // ElapsedTimeInSeconds    
    self.properties[self.columns[4]] += act.properties[act.columns[4]];  // MovingTimeInSeconds
    self.properties[self.columns[5]] = getDuration_(self.properties[act.columns[4]]);  // MovingDuration
    self.properties[self.columns[7]] += ',' + act.properties[self.columns[7]];  // ActivityID(s)
    self.properties[self.columns[10]] = determineWorkoutType(self.properties[self.columns[10]], act.properties[act.columns[10]]);  // WorkoutType
    
    return self;  // For chaining
    
    function determineWorkoutType(a,b) {
      if (a == 'Workout' || b == 'Workout') {
        return 'Workout';
      } else {
        return a;
      }
    }
  }
  
  return this;
  
  function initFromStrava(res) {
    // Initialize Activity instance from Strava activity
    //
    // @param {Object} res: a JSON response from Strava.
    //     See: https://developers.strava.com/docs/reference/#api-Activities-getActivityById
    //
    var activityDate = new Date(res.start_date_local);
    var timeZoneOffset = res.timezone.substring(4,10);  // e.g -08:00
    
    var props = {};
    props[self.columns[0]] = res.start_date_local.slice(0,-1) + timeZoneOffset; // CreatedAt
    props[self.columns[1]] = res.type;  // ActivityType
    props[self.columns[2]] = Number(res.distance);  // DistanceMeters
    props[self.columns[3]] = Number(res.elapsed_time);  // ElapsedTimeInSeconds
    props[self.columns[4]] = Number(res.moving_time);  // MovingTimeInSeconds
    props[self.columns[5]] = getDuration_(Number(res.moving_time));  // MovingDuration
    props[self.columns[6]] = Number(res.total_elevation_gain);  // TotalElevationGain
    props[self.columns[7]] = res.id; // ActivityID
    props[self.columns[8]] = activityDate.getWeekStart().MMDDYYYY(); // WeekStart
    props[self.columns[9]] = activityDate.getWeekStart().incDate(6).MMDDYYYY();  // WeekEnd
    props[self.columns[10]] = workoutTypeLookup(res.workout_type, res.type, res.commute);  // WorkoutType     
    
    return props;  
  }
  
  function initFromRow(row) {
    // Initialize Activity instance from Google Sheet row
    //
    // param {Array} row: a row from the Google Sheet as an array
    // Return {Object} the properties dictionary
    //
    var props = {};
    for (var i = 0; i < row.length; i++) {
      props[self.columns[i]] = row[i]; 
    }
    return props;
  }
  
  function workoutTypeLookup(id, type, isCommute) {
    // Get workout type based on Strava's workout type codes,
    // considering commute as a workout type.
    // 
    // param {Number} id: Strava's Activity IDs
    // param {String} type: the type of activity, e.g. run, ride, etc.
    // param {Boolean} isCommute: Strava's commute flag
    // return {String} the workout type, e.g. "Workout", "Race," etc...
    //
    if (Boolean(isCommute)) {
      return 'Commute';
    } else {
      switch(Number(id)) {
        case 1:
        case 11:
          return 'Race';
        case 2:
          return 'Long Run';
        case 3:
        case 12:
          return 'Workout';
        default:
          return type;
      }    
    }

  }

}

function getDuration_(dur) {
  // Convert seconds into HH:MM:SS format
  //
  // param {Number} an integer representing the number of seconds
  // return {string} A HH:MM:SS formatted string
  //
  var hrs = Math.floor(dur / (60 * 60));  
  var mins = Math.floor(((dur / (60 * 60)) - hrs) * 60);
  var secs = Math.floor(dur - (hrs * 60 * 60) - (mins * 60));
  
  return Utilities.formatString("%d:%02d:%02d", hrs, mins, secs);
}  //
// Date.gs
// ============================================================================
// Custom methods for working with dates
//

Date.prototype.toEpoch = function() {
  // Convert date to Epoch time, the number of seconds since January 1, 1970.
  // Return {Number} Unix Epoch timestamp for this date
  return this.getTime() / 1000;
}

Date.prototype.MMDDYYYY = function() {
  // Export date in American date format
  // Return {String} date in MM/DD/YYYY format
  var month = this.getMonth() + 1;
  var date = this.getDate();
  var year = this.getFullYear();
  return month + '/' + date + '/' + year;
}

Date.prototype.incDate = function(days) {
  // Increment date by one day
  // Return {Date, this} for chaining
  this.setDate(this.getDate() + days);
  return this;
}

Date.prototype.getWeekStart = function() {
  // Get the first day of the week given an arbitrary day.
  // Return {Date} A new date object
  var d = new Date(this.getTime());
  var monday = 1;
  while (d.getDay() !== monday) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

Date.prototype.minusYears = function(x) {
  // Subtract x years from the current date
  // Return {Date, this} this Date object instance, for chaining
  this.setFullYear(this.getFullYear() - x);
  return this;
}//
// Main.gs
// =================================================================================
//

// Global Variables
// ---------------------------------------------------------------------------------
//
var SCRIPT_PROPS = PropertiesService.getScriptProperties();
var SPREADSHEET = SpreadsheetApp.openById(SCRIPT_PROPS.getProperty('SHEET_ID'));
var CLIENT_ID = SCRIPT_PROPS.getProperty('STRAVA_CLIENT_ID');
var CLIENT_SECRET = SCRIPT_PROPS.getProperty('STRAVA_CLIENT_SECRET');
var PREV_YEAR_TAB = 'Previous Year';
var DATA_VARIABLES = ['CreatedAt', 'ActivityType', 'DistanceMeters', 'ElapsedTimeInSeconds', 
                  'MovingTimeInSeconds', 'MovingDuration', 'TotalElevationGain', 
                  'ActivityID', 'WeekStart', 'WeekEnd', 'WorkoutType'];

// Main functions
// ---------------------------------------------------------------------------------
// These are high-level actions and the functions called by Triggers

function createPreviousYearSheet() {
  // Create a brand new sheet for storing Strava activity data from the previous 12-months
  //
  var sheetName = PREV_YEAR_TAB;
  var columns = DATA_VARIABLES;
  var columnWidth = 200;  // in pixels
  var popFunc = 'updatePrevYearSheet_';

  var sheet = SPREADSHEET.getSheetByName(sheetName);
  if (!sheet) {    
    // Create and format sheet
    var sheet = SPREADSHEET.insertSheet();    
    sheet.setName(sheetName)
         .setColumnWidths(1, columns.length, columnWidth)
    sheet.deleteColumns(columns.length + 1, sheet.getMaxColumns() - columns.length);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, columns.length)
         .setValues([DATA_VARIABLES])
         .setFontWeight("bold")
         .setBackground('#6495ED')  // Cornflower blue
         .setFontColor('#ffffff');  // White

    // Set trigger
    var triggers = ScriptApp.getProjectTriggers().filter(function(trig) {
      return (trig.getHandlerFunction() === popFunc);
    });
    
    if (triggers.length) {
      throw new Error('A trigger for ' + popFunc + ' already exists. Delete this trigger first.');
    } else {
      // set trigger
      ScriptApp.newTrigger(popFunc)
        .timeBased()
        .atHour(0)
        .nearMinute(0)
        .everyDays(1)
        .create();
    }

    // Populate newly created sheet
    getLastYearActivities_(sheetName);
    
    // Resolve activity fragments
    resolveActivityFragments_(sheetName)

  } else {
    throw new Error(sheetName + ' already exists');
  }
}

function updatePrevYearSheet_() {
  // Append activities that happened after yesterday at mightnight to a
  // spreadsheet tab. Use this function in a time-based trigger.
  var yesterday = new Date().incDate(-1);
  yesterday.setHours(0, 0, 0);  // Set time to yesterday at precisely midnight
  return appendActivities_(yesterday, PREV_YEAR_TAB);
  
  pruneOldRecords_(PREV_YEAR_TAB);
}

function clearSheet_() {
  // Removes all data, excluding the sheet header, from the PREV_YEAR_TAB.
  
  var sheet = SPREADSHEET.getSheetByName(PREV_YEAR_TAB);
  var rowPosition = 2;  // Rows are one-indexed, they start at "1"
  var howMany = sheet.getLastRow() - 1;
  sheet.deleteRows(rowPosition, howMany);
}

function getLastYearActivities_(sheet) {
  // Populates an entire sheet with data straight from the Strava Activities API with
  // activities after the date specified in the variable `startDate`.
  //
  // Params:
  //   * sheet {Sheet} the instance of the Sheet class to populate
  //
  
  var now = new Date();
  var startDate = new Date(now.setFullYear(now.getFullYear() - 1));
  
  return appendActivities_(startDate, sheet);
}

function appendActivities_(startDate, sheet) {
  // Make a request to the Strava API's athlete activity list endpoint 
  // and append each of those activities as rows in the spreadsheet.

  var resultsPerPage = 100;
  var sheet = SPREADSHEET.getSheetByName(sheet);
  var i = 0;
  var res, body;
  do {
    i++;
    res = Strava.getActivitiesList({
      after: startDate.toEpoch(),
      page: i,
      per_page: resultsPerPage,
    });
    body = JSON.parse(res.getContentText());
    body.map(function(obj) {
      // Subset activity object data and export as array
      return new Activity_(obj).toRow();
    }).forEach(function(row) {
      // Add "new" data to the appropriate sheet    
      sheet.appendRow(row);    
    });
  } while (body.length !== 0);
  
  return null;
  
}

function pruneOldRecords_(sheetName) {
  // Remove records from the `PREV_YEAR_TAB` sheet older than one year.
  //
  // @TODO: sort sheet before performing this procedure. For correctness, this 
  // algorithm currently assumes that rows are ordered sequentially in ascending 
  // order by creation date. So if you sort the sheet it's not going to work. 
  
  var sheet = SPREADSHEET.getSheetByName(sheetName);

  // Set a threshold that's the beginning of the week for one year ago today
  var threshold = new Date().minusYears(1).getWeekStart();
  
  // Set a row offset to start removing rows from, Data rows start at rows 2
  var rowOffset = 2;
  
  // Create a boolean vector of whether or not this 
  var oldRows = sheet.getRange('A2:A')
                      .getValues()
                      .filter(function(createdAt) { 
                        return (new Date(createdAt) < threshold); 
                      });
  
  // Now remove rows that are too old, stopping when the loop reaches 
  // the first one within the time window
  if (oldRows.length > 0) {
    sheet.deleteRows(rowOffset, oldRows.length);  
  }
    
  return null;
  
}

function resolveActivityFragments_(sheetName) {
  // Combine multiple activities that are actually one activity. 
  //
  // Note: I often save an activity when I change shoes for a workout
  // This function will combine multiple Strava activites that were
  // saved close together into one row in the spreadsheet.
  
  var threshold = 3.6e+6 // 60 minutes in milliseconds
  var offset = 2;
  var sheet = SPREADSHEET.getSheetByName(sheetName);
  
  var rows = sheet.getRange('A2:K').getValues();
  var rowsDeleted = 0;
  
  findDupes(sheet.getRange('A2:B').getValues(), 3.6e+6).forEach(function(dupes) {
    dupes = dupes.map(function(dupe) { return dupe - offset; });  // Numbers are now indices into rows array
    var parentAct = new Activity_(rows[dupes[0]]);
    var childAct;
    
    for (var i = 1; i < dupes.length; i++) {
      childAct = new Activity_(rows[dupes[i]]);
      if (childAct.properties[childAct.columns[10]] !== 'Race') {
        parentAct.merge(childAct);
      }
    }
    
    // Overwrite the first row's value as the combine values in parent activity
    var rowNumber = dupes[0] + offset - rowsDeleted;
    var rowRange = 'A' + rowNumber + ':K' + rowNumber;
    sheet.getRange(rowRange).setValues([parentAct.toRow()]);
    
    // Remove the rows that are now merged in the parent row
    var rowsToDelete = dupes.length - 1
    sheet.deleteRows(rowNumber + 1, rowsToDelete);
    rowsDeleted += rowsToDelete;

  });
  
  return null;
  
  function findDupes(rows, threshold) {
    var mergeList = [];
    var cluster = [];
    for (var i = 0; i < rows.length - 1; i++) {
      var cur = rows[i];
      var nxt = rows[i + 1];
      var isBelowThreshold = ((new Date(nxt[0]) - new Date(cur[0])) < threshold)
      var isWithinActivity = (cur[1] === nxt[1]);
      
      if (isBelowThreshold && isWithinActivity) {  // if this is a duplicate pair of row
        if (cluster.length === 0) {  // if this is the first duplicate pair, add both
          cluster = cluster.concat([i + offset, i + offset + 1]);
        } else {  // cluster has already started so curr's row number is in the array, add the next item's row number
          cluster.push(i + offset + 1);
        }
      } else if (cluster.length > 0) {  // We are at the end of a sequence of duplicates
        mergeList.push(cluster);
        cluster = [];  // reset cluster
      }
    }
    
    return mergeList;
    
  }
  
}

// Functions for establishing a connection to Strava 
// ----------------------------------------------------
//

function establishStravaConnection() {
  // Initliazes Strava connection, only need to be run once
  Strava.authorize();
}

function resetStravaConnection() {
  Strava.service.reset();
}

function authCallback_(request) {
  // Handles the OAuth callback
  var authorized = Strava.service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}//
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