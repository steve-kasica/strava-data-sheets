//
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
}