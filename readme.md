## Google Sheets
### Setup
1. Create dedicated [Project](https://console.developers.google.com/projectcreate) 
2. Create [Service Account](https://console.developers.google.com/iam-admin/serviceaccounts) for this Project
3. Create new JSON Key assigned to newly created Service Account
4. Create new spreadsheet and share it with `client_email` which can be found in the JSON above; in spreadsheet's url you can find it's `id`
5. You will also need `private_key` from the JSON - but the app should complain about that later
