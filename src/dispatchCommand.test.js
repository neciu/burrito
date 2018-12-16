// @flow

import dispatchCommand, { orderResponse } from "./dispatchCommand";
import type { AddOrderItemCommand } from "./dispatchCommand";
import { openDialog, respond } from "./slackApi";
import { appendEvent } from "./eventStore";

jest.mock("./slackApi");
jest.mock("./eventStore");

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
    const expectedResult = undefined;

    const result = await dispatchCommand(command);

    expect(result).toEqual(expectedResult);
    expect(openDialog).toHaveBeenCalledWith(triggerId, dialog);
  });
});

describe("AddOrderItemCommand", () => {
  const command: AddOrderItemCommand = {
    command: "addOrderItem",
    userName: "My user name",
    orderItem: {
      type: "burrito",
      filling: "beef",
      sauce: "7",
      drink: "mangolade",
    },
    responseUrl: "https://lol.kat.zz",
  };

  it("should return undefined", async () => {
    const expectedResult = undefined;

    const result = await dispatchCommand(command);

    expect(result).toEqual(expectedResult);
  });

  it("should create proper event", async () => {
    await dispatchCommand(command);

    expect(appendEvent).toHaveBeenCalledWith(command);
  });

  it("send response", async () => {
    await dispatchCommand(command);

    expect(respond).toHaveBeenCalledWith(
      command.responseUrl,
      ":white_check_mark: You have ordered: burrito, beef, 7, mangolade",
    );
  });
});
