// @flow strict

import got from "got";
import { getBurritoDialog } from "./dispatchCommand";
import slackDialogOpener, { url } from "./slackDialogOpener";

it("should call slack dialog api with proper parameters", async () => {
  const triggerId = "tringgerId";
  const callbackId = "callbackId";
  const dialog = getBurritoDialog(callbackId);
  const gotResult = { result: "result" };
  const spy = jest
    .spyOn(got, "post")
    .mockImplementation(() => {})
    .mockResolvedValue(gotResult);
  const token = "token ohai!";
  process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN = token;

  const result = await slackDialogOpener(triggerId, dialog);

  expect(spy).toHaveBeenCalledWith(url, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${token}`,
    },
    json: true,
    body: {
      trigger_id: triggerId,
      dialog: {
        ...dialog,
        callback_id: dialog.callbackId,
        submit_label: dialog.submitLabel,
      },
    },
  });

  expect(result).toEqual(gotResult);
});
