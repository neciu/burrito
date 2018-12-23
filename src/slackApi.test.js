// @flow strict

import got from "got";
import { getBurritoDialog } from "./dispatchCommand";
import { dialogUrl, openDialog, respond } from "./slackApi";

const token = "token ohai!";
process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN = token;

it("openDialog should call slack dialog api with proper parameters", async () => {
  const triggerId = "tringgerId";
  const callbackId = "callbackId";
  const dialog = getBurritoDialog(callbackId);
  const gotResult = { result: "result" };
  const spy = jest
    .spyOn(got, "post")
    .mockImplementation(() => {})
    .mockResolvedValue(gotResult);

  const result = await openDialog(triggerId, dialog);

  expect(spy).toHaveBeenCalledWith(dialogUrl, {
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

it("respond should format post proper message to provider url", async () => {
  const responseUrl = "https://lol.kat.zz";
  const message = "Message here!";
  const expectedResult = { result: "result" };
  const spy = jest
    .spyOn(got, "post")
    .mockImplementation(() => {})
    .mockResolvedValue(expectedResult);

  const result = await respond(responseUrl, message);

  expect(result).toEqual(expectedResult);
  expect(spy).toHaveBeenCalledWith(responseUrl, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${token}`,
    },
    json: true,
    body: {
      text: message,
      response_type: "ephemeral",
    },
  });
});
