// @flow strict

import supertest from "supertest";
import fillTemplate from "es6-dynamic-template";
import myserver from "myserver";
import { orderResponse } from "dispatchCommand";
import {
  getNewOrderDateCollidingResponse,
  getNewOrderOkResponse,
  handleGetSms,
  helpResponse,
  openNewOrderWrongOrMissingDateResponse,
} from "slashCommands/slashCommands";
import {
  CloseOrderEvent,
  getEventStore,
  initializeEventStore,
  OpenNewOrderEvent,
} from "EventStoreService";
import { Order, OrderItem } from "aggregates/aggregates";
import OrderItemType from "OrderItemType";

function makePayload(params) {
  return {
    command: "/burrito",
    text: "help",
    user_id: "U1337",
    ...params,
  };
}

describe("order command", () => {
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

  it.each`
    text                          | expectedResponse
    ${"help"}                     | ${helpResponse}
    ${"definitely wrong command"} | ${helpResponse}
  `(
    "should return proper status code and response for $text",
    async ({ text, expectedStatus, expectedResponse }) => {
      const payload = makePayload({ text });

      await supertest(testServer)
        .post("/slack/commands")
        .send(payload)
        .expect(200, expectedResponse);
    },
  );

  it("should return error then there is no order", async () => {
    const events = await getEventStore().getStillOpenedOrdersOpenOrderEvents();
    expect(events.length).toEqual(0);

    const payload = makePayload({ text: "order" });

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, {
        text: "There is no opened order. Ask somebody for help if needed.",
      });
  });

  it("should return buttons when there is opened order", async () => {
    await getEventStore().openOrder("U1337", "2019-01-01");
    const payload = makePayload({ text: "order" });

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, orderResponse);
  });

  it("should return error if order is closed already", async () => {
    await getEventStore().openOrder("U1337", "2019-01-01");
    await getEventStore().closeOrder("U1337", "2019-01-01");
    const payload = makePayload({ text: "order" });

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, {
        text: "There is no opened order. Ask somebody for help if needed.",
      });
  });
});

describe("open new order command", () => {
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

  it.each`
    text                                | expectedResponse
    ${"open new order"}                 | ${openNewOrderWrongOrMissingDateResponse}
    ${"open new order 2019-11-666"}     | ${openNewOrderWrongOrMissingDateResponse}
    ${"open new order2019-11-11"}       | ${openNewOrderWrongOrMissingDateResponse}
    ${"open new order asas2019-11-01"}  | ${openNewOrderWrongOrMissingDateResponse}
    ${"open new order 2019-11-01 xaxs"} | ${openNewOrderWrongOrMissingDateResponse}
    ${"open new order 2019-11-01xaxs"}  | ${openNewOrderWrongOrMissingDateResponse}
    ${"open new order    2019-11-01"}   | ${getNewOrderOkResponse("2019-11-01")}
    ${"open new order 2019-11-01   "}   | ${getNewOrderOkResponse("2019-11-01")}
  `(
    "should return proper response $text",
    async ({ text, expectedResponse }) => {
      const payload = makePayload({ text });

      await supertest(testServer)
        .post("/slack/commands")
        .send(payload)
        .expect(200, expectedResponse);
    },
  );

  it("should append the event when proper date is provided", async () => {
    const payload = makePayload({ text: "open new order 2019-01-01" });
    let events = await getEventStore().getStillOpenedOrdersOpenOrderEvents();
    expect(events.length).toEqual(0);

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, getNewOrderOkResponse("2019-01-01"));

    const event: OpenNewOrderEvent = (await getEventStore().getStillOpenedOrdersOpenOrderEvents())[0];
    expect(event).toBeInstanceOf(OpenNewOrderEvent);
    expect(event.author).toEqual("U1337");
    expect(event.date).toEqual("2019-01-01");
  });

  it("should not append the event when there is an existing event with the same date", async () => {
    await getEventStore().openOrder("lol", "2019-01-01");
    const payload = makePayload({ text: "open new order 2019-01-01" });
    let events = await getEventStore().getStillOpenedOrdersOpenOrderEvents();
    expect(events.length).toEqual(1);

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, getNewOrderDateCollidingResponse("2019-01-01"));

    events = await getEventStore().getStillOpenedOrdersOpenOrderEvents();
    expect(events.length).toEqual(1);
    const event: OpenNewOrderEvent = events[0];
    expect(event).toBeInstanceOf(OpenNewOrderEvent);
    expect(event.author).toEqual("lol");
    expect(event.date).toEqual("2019-01-01");
  });
});

describe("close order command", () => {
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

  it("should append event then the order is already opened", async () => {
    await getEventStore().openOrder("U1337", "2019-01-01");
    const payload = makePayload({ text: "close order 2019-01-01" });

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200);

    const events = await getEventStore().getCloseOrderEvents();
    expect(events.length).toEqual(1);
    const event: CloseOrderEvent = events[0];
    expect(event).toBeInstanceOf(CloseOrderEvent);
    expect(event.author).toEqual("U1337");
    expect(event.date).toEqual("2019-01-01");
  });

  it("should not append event then the order is not opened", async () => {
    const payload = makePayload({ text: "close order 2019-01-01" });

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200);

    const events = await getEventStore().getCloseOrderEvents();
    expect(events.length).toEqual(0);
  });

  it("should not append event then the order is already closed", async () => {
    await getEventStore().closeOrder("U1337", "2019-01-01");
    const payload = makePayload({ text: "close order 2019-01-01" });
    let events = await getEventStore().getCloseOrderEvents();
    expect(events.length).toEqual(1);

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200);

    events = await getEventStore().getCloseOrderEvents();
    expect(events.length).toEqual(1);
  });
});

describe("show order command", () => {
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

  it("should display message informing that there is no opened order", async () => {
    const payload = makePayload({ text: "show order" });

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, {
        text: "There is no opened order. Ask somebody for help if needed.",
      });
  });

  it("should display message with all order items in current order", async () => {
    const author = "U1337";
    const date = "2019-01-01";
    const type = "big_burrito";
    const filling = "pork";
    const sauce = "7";
    const drink = "mangolade";
    const comments = "This is a short comment.";

    await getEventStore().openOrder(author, date);
    await getEventStore().addOrderItem(
      author,
      date,
      type,
      filling,
      sauce,
      drink,
      comments,
    );
    const payload = makePayload({ text: "show order" });

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, {
        text: `Items of the current order (${date}):
1. <@${author}>, ${type}, ${filling}, ${sauce}, ${drink}, ${comments}`,
      });
  });
});

describe("get sms command", () => {
  let testServer = undefined;

  beforeAll(() => {
    testServer = myserver.listen();
  });

  afterAll(() => {
    testServer && testServer.close();
  });

  beforeEach(() => {
    process.env.SMS_TEMPLATE = "${date}\n\n${items}\n\n${price}";
    initializeEventStore();
  });

  it.each`
    text                    | expectedResponse
    ${"get sms"}            | ${handleGetSms.responses.missingOrWrongDate()}
    ${"get sms2019-01-01"}  | ${handleGetSms.responses.missingOrWrongDate()}
    ${"get sms 201-01-01"}  | ${handleGetSms.responses.missingOrWrongDate()}
    ${"get sms 2019-0x-01"} | ${handleGetSms.responses.missingOrWrongDate()}
    ${"get sms 2019-01-01"} | ${handleGetSms.responses.noOrder("2019-01-01")}
  `(
    "should return proper response $text",
    async ({ text, expectedResponse }) => {
      const payload = makePayload({ text });

      await supertest(testServer)
        .post("/slack/commands")
        .send(payload)
        .expect(200, expectedResponse);
    },
  );

  describe("getSms response", () => {
    it("should handle one item", async () => {
      const date = "2019-01-01";
      const items = [
        new OrderItem(
          "id",
          OrderItemType.big_burrito,
          "beef",
          "4",
          "mangolade",
          "short comment",
        ),
      ];
      const order = new Order("id", date, true, items);

      const response = handleGetSms.responses.getSms(order);

      const expectedText = fillTemplate(process.env.SMS_TEMPLATE, {
        date,
        items: "1. D. burrito, wół, 4, mango.",
        price: "24,3",
      });
      expect(response).toEqual({ text: expectedText });
    });

    it("should handle two items", async () => {
      const date = "2019-01-02";
      const items = [
        new OrderItem(
          "id",
          OrderItemType.big_burrito,
          "beef",
          "4",
          "mangolade",
          "short comment",
        ),
        new OrderItem(
          "id",
          OrderItemType.small_burrito,
          "chicken",
          "6",
          undefined,
          "short comment",
        ),
      ];
      const order = new Order("id", date, true, items);

      const response = handleGetSms.responses.getSms(order);

      expect(response).toEqual({
        text: fillTemplate(process.env.SMS_TEMPLATE, {
          date,
          items: "1. D. burrito, wół, 4, mango.\n2. M. burrito, kura, 6.",
          price: "38,4",
        }),
      });
    });
  });

  describe("getSms", () => {
    it.each`
      type                               | filling         | sauce  | drink          | expectedText
      ${OrderItemType.big_burrito}       | ${"beef"}       | ${"1"} | ${"mangolade"} | ${"1. D. burrito, wół, 1, mango."}
      ${OrderItemType.big_burrito}       | ${"pork"}       | ${"2"} | ${"lemonade"}  | ${"1. D. burrito, wieprz, 2, lemon."}
      ${OrderItemType.small_burrito}     | ${"chicken"}    | ${"3"} | ${undefined}   | ${"1. M. burrito, kura, 3."}
      ${OrderItemType.double_quesadilla} | ${"vegetables"} | ${"4"} | ${"mangolade"} | ${"1. D. quesadilla, wege, 4, mango."}
      ${OrderItemType.double_quesadilla} | ${"beef"}       | ${"5"} | ${"lemonade"}  | ${"1. D. quesadilla, wół, 5, lemon."}
      ${OrderItemType.quesadilla}        | ${"pork"}       | ${"6"} | ${undefined}   | ${"1. M. quesadilla, wieprz, 6."}
      ${OrderItemType.quesadilla}        | ${"chicken"}    | ${"7"} | ${undefined}   | ${"1. M. quesadilla, kura, 7."}
    `(
      "should render item name properly $type $filling $sauce $drink",
      ({ type, filling, sauce, drink, expectedText }) => {
        const item = new OrderItem("", type, filling, sauce, drink, "");
        const order = new Order("", "", true, [item]);

        const response = handleGetSms.responses.getSms(order);

        expect(response.text).toContain(expectedText);
      },
    );
  });
});
