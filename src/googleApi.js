// @flow strict

import { google } from "googleapis";
import { performance } from "perf_hooks";

export type GoogleApi = {
  sheetsAppend: (request: any) => Promise<any>,
  sheetsGet: (request: any) => Promise<any>,
};

const api: GoogleApi = {
  sheetsAppend(request) {
    const auth = getJwtAuth();
    const sheets = getSheets(auth);

    console.info("sheetsAppend", { values: request.resource.values });
    const start = performance.now();
    return new Promise((resolve, reject) => {
      sheets.spreadsheets.values.append({ ...request, auth }, function(
        err,
        response,
      ) {
        const end = performance.now();
        if (err) {
          console.error("sheetsAppend", {
            values: request.resource.values,
            error: err,
            success: false,
            durationInMillis: end - start,
          });
          reject(err);
        } else {
          console.info("sheetsAppend", {
            values: request.resource.values,
            success: true,
            durationInMillis: end - start,
          });
          resolve(response);
        }
      });
    });
  },
  sheetsGet(request) {
    const auth = getJwtAuth();
    const sheets = getSheets(auth);

    console.info("sheetsGet", {});
    const start = performance.now();
    return new Promise((resolve, reject) => {
      sheets.spreadsheets.values.get({ ...request, auth }, function(
        err,
        response,
      ) {
        const end = performance.now();
        if (err) {
          console.error("sheetsGet", {
            error: err,
            success: false,
            durationInMillis: end - start,
          });
          reject(err);
        } else {
          console.info("sheetsGet", {
            success: true,
            durationInMillis: end - start,
          });
          resolve(response);
        }
      });
    });
  },
};
export default api;

function getJwtAuth() {
  const privateKey = (process.env.GOOGLE_ACCOUNT_KEY || "").replace(
    /\\n/g,
    "\n",
  );

  return new google.auth.JWT(
    process.env.GOOGLE_ACCOUNT_EMAIL,
    null,
    privateKey,
    ["https://www.googleapis.com/auth/spreadsheets"],
  );
}

function getSheets(auth) {
  return google.sheets({
    version: "v4",
    auth,
  });
}
