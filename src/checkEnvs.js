// @flow strict

const required_envs = [
  "PORT",
  "SLACK_SIGNING_SECRET",
  "SLACK_BOT_USER_OAUTH_ACCESS_TOKEN",
  "GOOGLE_ACCOUNT_KEY",
  "GOOGLE_ACCOUNT_EMAIL",
  "GOOGLE_SHEET_ID",
];

export function _checkEnvs(envs: Array<string>): void {
  const absentEnvs = envs.filter(e => !process.env[e]);
  if (absentEnvs.length > 0) {
    throw new Error(`Missing ENVs: ${absentEnvs.join(", ")}`);
  }
}

export default function checkEnvs(): void {
  _checkEnvs(required_envs);
}
