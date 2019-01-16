// @flow

import dispatchCommand, { orderResponse } from "dispatchCommand";
import { openDialog, respond } from "slackApi";
import { appendEvent } from "eventStore";
import type {
  AddOrderItemCommand,
  ShowOrderItemButtonsCommand,
  ShowOrderItemDialogCommand,
} from "commands";
import { CommandType } from "commands";
import OrderItemType from "OrderItemType";
import dialogs from "dialogs";

jest.mock("slackApi");
jest.mock("eventStore");

describe("ShowOrderItemButtonsCommand", () => {
  it("should return proper buttons", async () => {
    const command: ShowOrderItemButtonsCommand = {
      type: CommandType.show_order_item_buttons,
    };
    const result = await dispatchCommand(command);

    expect(result).toEqual(orderResponse);
  });
});

describe("ShowOrderItemDialogCommand", () => {
  it.each`
    itemType                           | dialog
    ${OrderItemType.big_burrito}       | ${dialogs[OrderItemType.big_burrito]}
    ${OrderItemType.small_burrito}     | ${dialogs[OrderItemType.small_burrito]}
    ${OrderItemType.quesadilla}        | ${dialogs[OrderItemType.quesadilla]}
    ${OrderItemType.double_quesadilla} | ${dialogs[OrderItemType.double_quesadilla]}
  `("should call openDialog for $itemType", async ({ itemType, dialog }) => {
    const command: ShowOrderItemDialogCommand = {
      type: CommandType.show_order_item_dialog,
      triggerId: "triggerId",
      itemType: itemType,
    };

    await dispatchCommand(command);

    expect(openDialog).toHaveBeenCalledWith(command.triggerId, dialog);
  });

  it.each`
    itemType                           | dialog
    ${OrderItemType.big_burrito}       | ${dialogs[OrderItemType.big_burrito]}
    ${OrderItemType.small_burrito}     | ${dialogs[OrderItemType.small_burrito]}
    ${OrderItemType.quesadilla}        | ${dialogs[OrderItemType.quesadilla]}
    ${OrderItemType.double_quesadilla} | ${dialogs[OrderItemType.double_quesadilla]}
  `("should return undefined for $itemType", async ({ itemType }) => {
    const command: ShowOrderItemDialogCommand = {
      type: CommandType.show_order_item_dialog,
      triggerId: "triggerId",
      itemType: itemType,
    };

    const result = await dispatchCommand(command);

    expect(result).toEqual(undefined);
  });
});

describe("AddOrderItemCommand", () => {
  it("should return undefined", async () => {
    const command: AddOrderItemCommand = {
      type: CommandType.add_order_item,
      responseUrl: "http://www.lolcats.com",
      userName: "Mr John Smith",
      item: {
        type: OrderItemType.big_burrito,
        filling: "beef",
        sauce: "1",
        drink: "mangolade",
        comments: "I like tacos!",
      },
    };

    const result = await dispatchCommand(command);

    expect(result).toEqual(undefined);
  });

  it("should store event", async () => {
    const command: AddOrderItemCommand = {
      type: CommandType.add_order_item,
      responseUrl: "http://www.lolcats.com",
      userName: "Mr John Smith",
      item: {
        type: OrderItemType.big_burrito,
        filling: "beef",
        sauce: "1",
        drink: "mangolade",
        comments: "I like tacos!",
      },
    };

    await dispatchCommand(command);

    expect(appendEvent).toBeCalledWith(command);
  });

  it.each`
    type                               | filling         | sauce  | drink          | message
    ${OrderItemType.big_burrito}       | ${"beef"}       | ${"1"} | ${"lemonade"}  | ${"big burrito with beef, mild salsa sauce (1) and lemonade"}
    ${OrderItemType.big_burrito}       | ${"chicken"}    | ${"2"} | ${"mangolade"} | ${"big burrito with chicken, hot salsa sauce (2) and mangolade"}
    ${OrderItemType.small_burrito}     | ${"pork"}       | ${"3"} | ${undefined}   | ${"small burrito with pork and chipottle sauce (3)"}
    ${OrderItemType.quesadilla}        | ${"vegetarian"} | ${"4"} | ${undefined}   | ${"quesadilla with vegetables and piri-piri sauce (4)"}
    ${OrderItemType.double_quesadilla} | ${"beef"}       | ${"5"} | ${"mangolade"} | ${"double quesadilla with beef, habanero sauce (5) and mangolade"}
    ${OrderItemType.small_burrito}     | ${"chicken"}    | ${"6"} | ${undefined}   | ${"small burrito with chicken and naga jolokia sauce (6)"}
    ${OrderItemType.small_burrito}     | ${"beef"}       | ${"7"} | ${undefined}   | ${"small burrito with beef and killer sauce (7)"}
  `(
    "should call respond for $type $filling $sauce $drink",
    async ({ type, filling, sauce, drink, message }) => {
      const command: AddOrderItemCommand = {
        type: CommandType.add_order_item,
        responseUrl: "http://www.lolcats.com",
        userName: "Mr John Smith",
        item: {
          type: type,
          filling: filling,
          sauce: sauce,
          drink: drink,
          comments: "I like tacos!",
        },
      };

      await dispatchCommand(command);

      expect(respond).toBeCalledWith(
        command.responseUrl,
        `:white_check_mark: You have ordered: ${message}`,
      );
    },
  );
});
