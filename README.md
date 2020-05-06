# Strava Data Sheets

[Google Apps Script (GAS)](https://developers.google.com/apps-script) project for exporting [Strava](https://www.strava.com/about) data to [Google Sheets](https://www.google.com/sheets/about/). I export a subset of a my Strava data this way to visualize this data in [Observable notebooks](https://observablehq.com/collection/@stvkas/strava-gas-powered-vis). Since GAS doesn't integrate with Git, I do my best to keep this repo synchronized with the script project. But the [production code](https://docs.google.com/spreadsheets/d/189X1mZ3IxzOMxr6Y7WMnyRk9JaPFA7KO8coeGV5joHc/edit?usp=sharing) and the [Google Sheet](https://docs.google.com/spreadsheets/d/189X1mZ3IxzOMxr6Y7WMnyRk9JaPFA7KO8coeGV5joHc/edit?usp=sharing) is publically viewable.

## Project Structure

Each of these files is concatenated into `Code.gs` for easy replication. 

* [`Activity.gs`](https://github.com/swkasica/strava-data/blob/master/Activity.gs): A class for representing Strava activities in tabular form.
* [`Main.gs`](https://github.com/swkasica/strava-data/blob/master/Main.gs): High-level routines to execute
* [`Date.gs`](https://github.com/swkasica/strava-data/blob/master/Date.gs): Additional methods for JavaScripts `Date` object
* [`Strava.gs`](https://github.com/swkasica/strava-data/blob/master/Strava.gs): A high-level library for interacting with Strava's API