# Strava Data Sheets

This [Google Apps Script (GAS)](https://developers.google.com/apps-script) project creates a data repo for your personal activity data on [Strava](https://www.strava.com/about) in a [Google Sheet](https://www.google.com/sheets/about/). When up and running, it polls Strava via its activity API and copies a subset of the data as rows in a spreadsheet. I use this code to export some of my Strava data to visualize it in [Observable notebooks](https://observablehq.com/collection/@stvkas/strava-gas-powered-vis).

## Replication
Replicating this data repo with your own Strava data currently requires you to create your own application with this code. See the [Initial Setup walkthrough](https://github.com/swkasica/strava-data/wiki/Initial-Setup) in the wiki for details.

## Project Structure

Each of these files is concatenated into `Code.gs` for easy replication. I've excluded tests for this code in [`tests.gs`](https://github.com/swkasica/strava-data/blob/master/src/tests.gs) from this production code.

* [`Activity_.gs`](https://github.com/swkasica/strava-data/blob/master/src/Activity_.gs): A class for representing Strava activities in tabular form.
* [`Date.gs`](https://github.com/swkasica/strava-data/blob/master/src/Date.gs): Additional methods for JavaScripts `Date` object
* [`Main.gs`](https://github.com/swkasica/strava-data/blob/master/src/Main.gs): High-level routines to execute
* [`Strava.gs`](https://github.com/swkasica/strava-data/blob/master/src/Strava.gs): A high-level library for interacting with Strava's API