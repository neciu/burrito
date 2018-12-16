// @flow strict

import got from "got";
import type { Dialog } from "./types";

export const dialogUrl = "https://slack.com/api/dialog.open";

export async function openDialog(triggerId: string, dialog: Dialog) {
  return got.post(dialogUrl, {
    json: true,
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN ||
        ""}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: buildDialogBody(triggerId, dialog),
  });
}

function buildDialogBody(triggerId: string, dialog: Dialog) {
  return {
    trigger_id: triggerId,
    dialog: {
      ...dialog,
      callback_id: dialog.callbackId,
      submit_label: dialog.submitLabel,
    },
  };
}

export async function respond(responseUrl: string, message: string) {
  return got.post(responseUrl, {
    json: true,
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN ||
        ""}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: {
      text: message,
      response_type: "ephemeral",
    },
  });
}
