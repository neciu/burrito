// @flow

import dispatchCommand, { orderResponse } from "./dispatchCommand";
import slackDialogOpener from "./slackDialogOpener";

jest.mock("./slackDialogOpener");

describe("OrderCommand", () => {
  it("should return proper buttons", async () => {
    const command = { author: "author", command: "order" };
    const result = await dispatchCommand(command);

    expect(result).toEqual(orderResponse);
  });
});

describe("ShowBurritoOrderFormCommand", () => {
  it("should call slackDialogOpener", async () => {
    const triggerId = "triggerId";
    const dialog = {
      callbackId: "callbackId",
      title: "title",
      submitLabel: "submitLabel",
      elements: [],
    };
    const command = {
      command: "showBurritoDialog",
      triggerId,
      dialog,
    };

    await dispatchCommand(command);

    expect(slackDialogOpener).toHaveBeenCalledWith(triggerId, dialog);
  });
});
