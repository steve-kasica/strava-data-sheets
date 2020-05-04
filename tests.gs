//
// test.gs
// =================================================================================
// This is where I keep my "test" code, mostly smoke tests for sanity checking.

var sampleActivity = {
  "id" : 123456778928065,
  "resource_state" : 3,
  "external_id" : null,
  "upload_id" : null,
  "athlete" : {
    "id" : 12343545645788,
    "resource_state" : 1
  },
  "name" : "Chill Day",
  "distance" : 0,
  "moving_time" : 18373,
  "elapsed_time" : 18373,
  "total_elevation_gain" : 0,
  "type" : "Ride",
  "start_date" : "2018-02-20T18:02:13Z",
  "start_date_local" : "2018-02-20T10:02:13Z",
  "timezone" : "(GMT-08:00) America/Los_Angeles",
  "utc_offset" : -28800,
  "achievement_count" : 0,
  "kudos_count" : 0,
  "comment_count" : 0,
  "athlete_count" : 1,
  "photo_count" : 0,
  "map" : {
    "id" : "a12345678908766",
    "polyline" : null,
    "resource_state" : 3
  },
  "trainer" : false,
  "commute" : false,
  "manual" : true,
  "private" : false,
  "flagged" : false,
  "gear_id" : "b453542543",
  "from_accepted_tag" : null,
  "average_speed" : 0,
  "max_speed" : 0,
  "device_watts" : false,
  "has_heartrate" : false,
  "pr_count" : 0,
  "total_photo_count" : 0,
  "has_kudoed" : false,
  "workout_type" : null,
  "description" : null,
  "calories" : 0,
  "segment_efforts" : [ ]
};

function Test_(name, description, func) {
  // A class for creating unit tests
  this.run = func;
  
  this.isSuccess = false;
  
  this.run = func;
  
  this.printMessage = function(msg) {
    var status = (this.isSuccess) ? "Success" : "Failure"
    return '\n' + name + ": " + status + "\nDescription: " + description + '\n' + msg;
  }
  
  return this;
};

var tests = [

  new Test_(
    'Parse Created Date', 
    'Strava\'s datetime format is converted to a JavaScript date object',
    function() {
      var activity = new Activity(sampleActivity);
      var out = activity.properties.CreatedAt;
      if (!isNaN(Date.parse(out))) {
        this.isSuccess = true;
      }
      return sampleActivity.start_date_local + ' == ' + out;
    }
  ),
  
  new Test_(
    'Get Duration',
    'Parse integer durations into Human-readable form',
    function() {
      var sample = [
        {inpt: 1000, expected: '0:16:40'},
        {inpt: 5000, expected: '1:23:20'},
        {inpt: 3781, expected: '1:03:01'}
      ];
      
      this.isSuccess = true;
      var msg = 'Details:\n';
  
      sample.forEach(function(t) {
        var time = getDuration_(t.inpt);
        var status = (time === t.expected);
        msg += '\t\t' + status + ': Input is ' + t.inpt + ' Actual is ' + time + ' Expected is ' + t.expected + '\n'; 
        
        this.isSuccess = (this.isStatus) ? status : false;        
        
      });
      
      return msg;
      
    }
  ),
  
  new Test_(
    'Get Activity',
    'Connect to Strava Activity endpoint',
    function() {
      var id = '2477212426'
      var res = Strava.getActivity(id);
      this.isSuccess = (typeof res === "object" && res !== null);
      return (this.isSuccess) ? 'Fetched activity: ' + res.name : 'Failed to fetch activity' + id; 
    }
  ),
  
  new Test_(
    'Date Format',
    'Convert date to MM/DD/YYYY format',
    function() {
      var d1 = new Date();
      var d2 = d1.MMDDYYYY();
      this.isSuccess = String(d2).match(/\d{1,2}\/\d{1,2}\/\d{4}/);
      return d1 + ' ==> ' + d2; 
    }
  ),
      
  new Test_(
    'Get Week Start',
    'Get the correct start of the week for a date object',
    function() {
      var d = new Date(sampleActivity.start_date_local);
      d.setHours(0);
      d.setMinutes(0);
      d.setSeconds(0);
      var actual = d.getWeekStart();
      var feb = 1;  // months are zero-indexed
      var expected = new Date(2018, feb, 19);
      this.isSuccess = (actual.getTime() === expected.getTime());
      return 'Actual: ' + actual + ', Expected: ' + expected;
    }
  )
];

function runTests() {
  // Run all tests
  
  var results = tests.map(function(test) {
    var output = { status: false, message: '' };
    
    try {
      var result = test.run();
      output.message = test.printMessage(result);
    } catch(err) {
      output.message = test.printMessage(err);
    }
    output.status = test.isSuccess;
    
    return output;
  });
  
  var total = results.reduce(function(acc, curr) { return acc + ((curr.status) ? 1 : 0) }, 0);
  var msg = 'Passed ' + total + '/' + results.length + ' tests\n\n';  
  msg += results.map(function(obj) { return obj.message + '\n' });
  
  Logger.log(msg);
}