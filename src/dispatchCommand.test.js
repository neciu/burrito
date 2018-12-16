// @flow

import dispatchCommand, { orderResponse } from "./dispatchCommand";
import type { AddOrderItemCommand } from "./dispatchCommand";
import slackDialogOpener from "./slackDialogOpener";
import { appendEvent } from "./eventStore";

jest.mock("./slackDialogOpener");
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

    await dispatchCommand(command);

    expect(slackDialogOpener).toHaveBeenCalledWith(triggerId, dialog);
  });
});

describe("AddOrderItemCommand", () => {
  it("should create proper event", async () => {
    const command: AddOrderItemCommand = {
      command: "addOrderItem",
      userName: "My user name",
      orderItem: {
        type: "burrito",
        filling: "beef",
        sauce: "7",
        drink: "mangolade",
      },
    };
    const mockedResult = { text: "OL RIGT" };
    // $FlowFixMe
    appendEvent.mockResolvedValue(mockedResult);

    const result = await dispatchCommand(command);

    expect(result).toEqual(mockedResult);
    expect(appendEvent).toHaveBeenCalledWith(command);
  });
});
