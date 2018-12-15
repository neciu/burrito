// @flow strict

import got from "got";
import type { Dialog } from "./types";

export const url = "https://slack.com/api/dialog.open";

export default async function slackDialogOpener(
  triggerId: string,
  dialog: Dialog,
) {
  return got.post(url, {
    json: true,
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN ||
        ""}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: buildBody(triggerId, dialog),
  });
}

function buildBody(triggerId: string, dialog: Dialog) {
  return {
    trigger_id: triggerId,
    dialog: {
      ...dialog,
      callback_id: dialog.callbackId,
      submit_label: dialog.submitLabel,
    },
  };
}
