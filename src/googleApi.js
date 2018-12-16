// @flow strict

import { google } from "googleapis";

export type GoogleApi = {
  sheetsAppend: (request: any) => Promise<any>,
};

const api: GoogleApi = {
  sheetsAppend(request) {
    const auth = getJwtAuth();
    const sheets = getSheets(auth);

    return new Promise((resolve, reject) => {
      sheets.spreadsheets.values.append({ ...request, auth }, function(
        err,
        response,
      ) {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  },
};
export default api;

function getJwtAuth() {
  return new google.auth.JWT(
    process.env.GOOGLE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_ACCOUNT_KEY,
    ["https://www.googleapis.com/auth/spreadsheets"],
  );
}

function getSheets(auth) {
  return google.sheets({
    version: "v4",
    auth,
  });
}
