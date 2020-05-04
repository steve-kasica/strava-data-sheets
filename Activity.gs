//
// Activity.gs
// ===================================================================================================================
// A class for representing Strava Activities as rows in the spreadsheet
//

var Activity = function(activity) {
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

  self.columns = ['CreatedAt', 'ActivityType', 'DistanceMeters', 'ElapsedTimeInSeconds', 
                  'MovingTimeInSeconds', 'MovingDuration', 'TotalElevationGain', 
                  'ActivityID', 'WeekStart', 'WeekEnd', 'WorkoutType'];
  
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
}  