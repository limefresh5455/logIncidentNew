// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
const hostName = document.location.host;
let API_URL = "https://api.logincidentapp.com/";
if (hostName == "localhost:4200") {
  // API_URL = 'https://staging-api.logincidentapp.com/';
  // API_URL = 'http://localhost:8110/';
  API_URL = "https://de13api.logincident.com/";
} else if (hostName == "de13.logincident.com") {
  API_URL = "https://de13api.logincident.com/";
} else if (hostName == "de11.logincident.com") {
  API_URL = "https://de11api.logincident.com/";
} else if (hostName == "de10.logincident.com") {
  API_URL = "https://de10api.logincident.com/";
} else if (hostName == "de12.logincident.com") {
  API_URL = "https://de12api.logincident.com/";
} else if (hostName == "staging.logincidentapp.com") {
  API_URL = "https://staging-api.logincidentapp.com/";
} else if (hostName == "https://te04.logincident.com") {
  API_URL = "https://te04api.logincident.com/";
}

export const environment = {
  production: true,
  API_URL: API_URL,
};

console.log("hostname environment: ", hostName);

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
