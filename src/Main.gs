//
// Main.gs
// =================================================================================
//

// Global Variables
// ---------------------------------------------------------------------------------
//
var SCRIPT_PROPS = PropertiesService.getScriptProperties();
var SPREADSHEET = SpreadsheetApp.openById(SCRIPT_PROPS.getProperty('SHEET_ID'));
var PREV_YEAR_TAB = 'Previous Year';

// Main functions
// ---------------------------------------------------------------------------------
// These are high-level actions and the functions called by Triggers

function clearSheet() {
  // Removes all data, excluding the sheet header, from the PREV_YEAR_TAB.
  
  var sheet = SPREADSHEET.getSheetByName(PREV_YEAR_TAB);
  var rowPosition = 2;  // Rows are one-indexed, they start at "1"
  var howMany = sheet.getLastRow() - 1;
  sheet.deleteRows(rowPosition, howMany);
}

function getAllActivities() {
  // Populates an entire sheet with data straight from the Strava Activities API with
  // activities after the date specified in the variable `startDate`.
  
  var december = 11;  // Months are zero-indexed
  var startDate = new Date(2018, december, 1);
  
  return appendActivities(startDate);
}

function getYesterdaysActivities() {
  // Append activities that happened after yesterday at mightnight to a
  // spreadsheet tab. Use this function in a time-based trigger.
  
  var yesterday = new Date().incDate(-1);
  yesterday.setHours(0, 0, 0);  // Set time to yesterday at precisely midnight
  
  return appendActivities(yesterday);
}

function appendActivities(startDate) {
  // Make a request to the Strava API's athlete activity list endpoint 
  // and append each of those activities as rows in the spreadsheet.

  var resultsPerPage = 100;
  var sheet = SPREADSHEET.getSheetByName(PREV_YEAR_TAB);
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
      return new Activity(obj).toRow();
    }).forEach(function(row) {
      // Add "new" data to the appropriate sheet    
      sheet.appendRow(row);    
    });
  } while (body.length !== 0);
  
  return null;
  
}

function pruneOldRecords() {
  // Remove records from the `PREV_YEAR_TAB` sheet older than one year.
  //
  // @TODO: sort sheet before performing this procedure. For correctness, this 
  // algorithm currently assumes that rows are ordered sequentially in ascending 
  // order by creation date. So if you sort the sheet it's not going to work. 
  
  var sheet = SPREADSHEET.getSheetByName(PREV_YEAR_TAB);

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

function resolveActivityFragments() {
  // Combine multiple activities that are actually one activity. 
  //
  // Note: I often save an activity when I change shoes for a workout
  // This function will combine multiple Strava activites that were
  // saved close together into one row in the spreadsheet.
  
  var threshold = 3.6e+6 // 60 minutes in milliseconds
  var offset = 2;
  var sheet = SPREADSHEET.getSheetByName(PREV_YEAR_TAB);
  
  var rows = sheet.getRange('A2:K').getValues();
  var rowsDeleted = 0;
  
  findDupes(sheet.getRange('A2:B').getValues(), 3.6e+6).forEach(function(dupes) {
    dupes = dupes.map(function(dupe) { return dupe - offset; });  // Numbers are now indices into rows array
    var parentAct = new Activity(rows[dupes[0]]);
    var childAct;
    
    for (var i = 1; i < dupes.length; i++) {
      childAct = new Activity(rows[dupes[i]]);
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