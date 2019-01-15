// @flow strict

import server from "server/server";
import supertest from "supertest";
import dispatchCommand from "dispatchCommand";
import CallbackId from "CallbackId";
import OrderItemType from "OrderItemType";
import type { AddOrderItemCommand, ShowOrderItemDialogCommand } from "commands";
import { CommandType } from "commands";

jest.mock("dispatchCommand");

describe("POST /slack/actions", () => {
  let testServer = undefined;

  beforeAll(() => {
    testServer = server.listen();
  });

  afterAll(() => {
    // $FlowFixMe
    testServer.close();
  });

  it.each`
    name                   | orderItemType
    ${"big burrito"}       | ${OrderItemType.big_burrito}
    ${"small burrito"}     | ${OrderItemType.small_burrito}
    ${"quesadilla"}        | ${OrderItemType.quesadilla}
    ${"double quesadilla"} | ${OrderItemType.double_quesadilla}
  `(
    "should dispatch ShowOrderItemDialogCommand for: $name",
    async ({ orderItemType }) => {
      const payload = {
        type: "interactive_message",
        callback_id: CallbackId.show_order_item_dialog,
        actions: [{ name: "orderItem", value: orderItemType }],
        trigger_id: "trigger_id",
      };
      const command: ShowOrderItemDialogCommand = {
        type: CommandType.show_order_item_dialog,
        itemType: orderItemType,
        triggerId: payload.trigger_id,
      };
      const mockedResult = {};
      dispatchCommand.mockResolvedValue(mockedResult);

      await supertest(testServer)
        .post("/slack/actions")
        .send({ payload: JSON.stringify(payload) })
        .expect(204, mockedResult);

      expect(dispatchCommand).toHaveBeenCalledWith(command);
    },
  );

  it.each`
    name                   | orderItemType                      | containsDrink
    ${"big burrito"}       | ${OrderItemType.big_burrito}       | ${true}
    ${"small burrito"}     | ${OrderItemType.small_burrito}     | ${false}
    ${"quesadilla"}        | ${OrderItemType.quesadilla}        | ${false}
    ${"double quesadilla"} | ${OrderItemType.double_quesadilla} | ${true}
  `(
    "should dispatch AddOrderItemCommand for: $name",
    async ({ orderItemType, containsDrink }) => {
      const payload = {
        type: "dialog_submission",
        callback_id: CallbackId.add_order_item,
        response_url: "response_url",
        user: {
          id: "U1337",
          name: "Mr John Smith",
        },
        state: orderItemType,
        submission: {
          filling: "filling",
          sauce: "sauce",
          drink: "drink",
          comments: "comments",
        },
      };
      const command: AddOrderItemCommand = {
        type: CommandType.add_order_item,
        responseUrl: payload.response_url,
        userName: payload.user.id,
        item: {
          type: orderItemType,
          filling: payload.submission.filling,
          sauce: payload.submission.sauce,
          drink: containsDrink ? payload.submission.drink : undefined,
          comments: payload.submission.comments,
        },
      };
      const mockedResult = {};
      dispatchCommand.mockResolvedValue(mockedResult);

      await supertest(testServer)
        .post("/slack/actions")
        .send({ payload: JSON.stringify(payload) })
        .expect(204, mockedResult);

      expect(dispatchCommand).toHaveBeenCalledWith(command);
    },
  );
});
