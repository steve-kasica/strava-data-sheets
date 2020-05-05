//
// server.gs
// --------------------------------------------------------------
// A script full of function for interacting with the Strava API.
// Sensitive variables such as CLIENT_SCECRET are not included
//
//

function authenticate() {
  // Authorizes and makes a request to the Strava API.
  var service = getService_();
  if (service.hasAccess()) {
    var url = 'https://www.strava.com/api/v3/activities';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      }
    });
    var result = JSON.parse(response.getContentText());
    Logger.log(JSON.stringify(result, null, 2));
  } else {
    var authorizationUrl = service.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s',
        authorizationUrl);
  }
}


function reset() {
  // Reset the authorization state, so that it can be re-tested.
  var service = getService_();
  service.reset();
}

function getService_() {
   // Configures the service.
   // Three required and optional parameters are not specified
   // because the library creates the authorization URL with them
   // automatically: `redirect_url`, `response_type`, and
   // `state`.
  var id = SCRIPT_PROPS.getProperty('STRAVA_CLIENT_ID');
  var secret = SCRIPT_PROPS.getProperty('STRAVA_CLIENT_SECRET');
  return OAuth2.createService('Strava')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://www.strava.com/oauth/authorize')
      .setTokenUrl('https://www.strava.com/oauth/token')

      // Set the client ID and secret.
      .setClientId(id)
      .setClientSecret(secret)
      
//      .setScope('https://www.strava.com/oauth/authorize')
      .setParam('scope', 'activity:read_all')

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback_')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties());
}

function authCallback_(request) {
  // Handles the OAuth callback.
  var service = getService_();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}
