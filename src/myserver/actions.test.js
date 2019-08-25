// @flow strict

import supertest from "supertest";
import dispatchCommand from "dispatchCommand";
import CallbackId from "CallbackId";
import OrderItemType from "OrderItemType";
import type { AddOrderItemCommand, ShowOrderItemDialogCommand } from "commands";
import { CommandType } from "commands";
import myserver from "myserver/index";
import { getEventStore, initializeEventStore } from "EventStoreService";
import { ReceivePaymentEvent } from "burritoEvents";
import { respond } from "slackApi";
import {
  closeOrder,
  createOrder,
  createOrderItem,
  refreshOrder,
} from "testutils";
import { readableMoneyAmount } from "eventStoreUtils";

jest.mock("dispatchCommand");
jest.mock("slackApi");

describe("POST /slack/actions", () => {
  let testServer = undefined;

  beforeAll(() => {
    testServer = myserver.listen();
  });

  afterAll(() => {
    testServer && testServer.close();
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

describe("receive payment submission", () => {
  let testServer = undefined;

  beforeAll(() => {
    testServer = myserver.listen();
  });

  afterAll(() => {
    testServer && testServer.close();
  });

  beforeEach(() => {
    initializeEventStore();
  });

  it("should store payment in event store", async () => {
    let events = await getEventStore().getReceivePaymentEvents();
    expect(events.length).toEqual(0);
    const payload = {
      type: "dialog_submission",
      callback_id: CallbackId.receive_payment,
      response_url: "lolkatz.com",
      user: {
        id: "U1337",
      },
      submission: {
        sender: "U1337x2",
        amount: "4242",
        type: "bank_transfer",
        comments: "No comments...",
      },
    };

    await supertest(testServer)
      .post("/slack/actions")
      .send({ payload: JSON.stringify(payload) })
      .expect(204, {});

    events = await getEventStore().getReceivePaymentEvents();
    expect(events.length).toEqual(1);
    const event: ReceivePaymentEvent = events[0];
    expect(event.author).toEqual("U1337");
    expect(event.sender).toEqual("U1337x2");
    expect(event.amount).toEqual(4242);
    expect(event.type).toEqual("bank_transfer");
    expect(event.comments).toEqual("No comments...");
  });

  it("should return a message with balance", async () => {
    let order = await createOrder();
    const item = await createOrderItem(order);
    await closeOrder(order);
    await refreshOrder(order);

    const payload = {
      type: "dialog_submission",
      callback_id: CallbackId.receive_payment,
      response_url: "lolkatz.com",
      user: {
        id: "U1337",
      },
      submission: {
        sender: item.author,
        amount: "4242",
        type: "bank_transfer",
        comments: "No comments...",
      },
    };

    await supertest(testServer)
      .post("/slack/actions")
      .send({ payload: JSON.stringify(payload) })
      .expect(204, {});

    const before = readableMoneyAmount(item.getPrice() + 720);
    const after = readableMoneyAmount(4242 - (item.getPrice() + 720));
    expect(respond).toHaveBeenCalledWith(
      "lolkatz.com",
      `:white_check_mark: 42,42 PLN received.\nBalance before: -${before} PLN.\nBalance after: ${after} PLN.`,
    );
  });
});
