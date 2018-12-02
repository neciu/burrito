const { google } = require("googleapis");

authorize(listMajors);

function authorize(callback) {
  const jwt = new google.auth.JWT(
    process.env.GOOGLE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_ACCOUNT_KEY,
    ["https://www.googleapis.com/auth/spreadsheets"],
  );

  callback(jwt);
}

function listMajors(auth) {
  const sheets = google.sheets({
    version: "v4",
    auth,
  });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Class Data!A2:E",
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const rows = res.data.values;
      if (rows.length) {
        console.log("Name, Major:");
        // Print columns A and E, which correspond to indices 0 and 4.
        rows.map(row => {
          console.log(`${row[0]}, ${row[4]}`);
        });
      } else {
        console.log("No data found.");
      }
    },
  );

  const request = {
    spreadsheetId: process.env.GOOGLE_SHEET_ID, // TODO: Update placeholder value.
    range: "Class Data!A33:E",
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [["Void", "Canvas", "Website"], ["Paul", "Shan", "Human"]],
    },
    auth,
  };

  sheets.spreadsheets.values.append(request, function(err, response) {
    if (err) {
      console.error(err);
      return;
    }

    // TODO: Change code below to process the `response` object:
    console.log(JSON.stringify(response, null, 2));
  });
}
