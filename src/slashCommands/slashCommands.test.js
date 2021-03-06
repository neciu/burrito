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
import { getEventStore, initializeEventStore } from "EventStoreService";
import { Order, OrderItem } from "aggregates/aggregates";
import OrderItemType from "OrderItemType";
import { Drinks, Fillings } from "types";
import { CloseOrderEvent, OpenNewOrderEvent } from "burritoEvents";
import { openDialog } from "slackApi";
import dialogs from "dialogs";
import CallbackId from "CallbackId";
import {
  createOrder,
  closeOrder,
  createOrderItem,
  refreshOrder,
  createPayment,
} from "testutils";
import { readableMoneyAmount } from "eventStoreUtils";

jest.mock("slackApi");

function makePayload(params) {
  return {
    command: "/burrito",
    text: "help",
    user_id: "U1337",
    trigger_id: "tr1gg3r_id",
    ...params,
  };
}

const author = "U1337";
const author2 = "U1337x2";
const date = "2019-01-01";
const date2 = "2019-02-01";

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
    const filling = Fillings.pork;
    const sauce = "7";
    const drink = Drinks.mangolade;
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
          author,
          OrderItemType.big_burrito,
          Fillings.beef,
          "4",
          Drinks.mangolade,
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
          author,
          OrderItemType.big_burrito,
          Fillings.beef,
          "4",
          Drinks.mangolade,
          "short comment",
        ),
        new OrderItem(
          "id",
          author,
          OrderItemType.small_burrito,
          Fillings.chicken,
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
          price: "38,7",
        }),
      });
    });
  });

  describe("getSms", () => {
    it.each`
      type                               | filling                | sauce  | drink               | expectedText
      ${OrderItemType.big_burrito}       | ${Fillings.beef}       | ${"1"} | ${Drinks.mangolade} | ${"1. D. burrito, wół, 1, mango."}
      ${OrderItemType.big_burrito}       | ${Fillings.pork}       | ${"2"} | ${Drinks.lemonade}  | ${"1. D. burrito, wieprz, 2, lemon."}
      ${OrderItemType.small_burrito}     | ${Fillings.chicken}    | ${"3"} | ${undefined}        | ${"1. M. burrito, kura, 3."}
      ${OrderItemType.double_quesadilla} | ${Fillings.vegetables} | ${"4"} | ${Drinks.mangolade} | ${"1. D. quesadilla, wege, 4, mango."}
      ${OrderItemType.double_quesadilla} | ${Fillings.beef}       | ${"5"} | ${Drinks.lemonade}  | ${"1. D. quesadilla, wół, 5, lemon."}
      ${OrderItemType.quesadilla}        | ${Fillings.pork}       | ${"6"} | ${undefined}        | ${"1. M. quesadilla, wieprz, 6."}
      ${OrderItemType.quesadilla}        | ${Fillings.chicken}    | ${"7"} | ${undefined}        | ${"1. M. quesadilla, kura, 7."}
    `(
      "should render item name properly $type $filling $sauce $drink",
      ({ type, filling, sauce, drink, expectedText }) => {
        const item = new OrderItem("", author, type, filling, sauce, drink, "");
        const order = new Order("", "", true, [item]);

        const response = handleGetSms.responses.getSms(order);

        expect(response.text).toContain(expectedText);
      },
    );

    it("should sort items by type", () => {
      const items = [
        new OrderItem(
          "",
          author,
          OrderItemType.double_quesadilla,
          Fillings.beef,
          "1",
          Drinks.mangolade,
          "",
        ),
        new OrderItem(
          "",
          author,
          OrderItemType.quesadilla,
          Fillings.beef,
          "1",
          undefined,
          "",
        ),
        new OrderItem(
          "",
          author,
          OrderItemType.big_burrito,
          Fillings.beef,
          "1",
          Drinks.mangolade,
          "",
        ),
        new OrderItem(
          "",
          author,
          OrderItemType.small_burrito,
          Fillings.beef,
          "1",
          undefined,
          "",
        ),
      ];
      const order = new Order("", "", true, items);

      const response = handleGetSms.responses.getSms(order);

      const expectedText = `
1. D. burrito, wół, 1, mango.
2. M. burrito, wół, 1.
3. D. quesadilla, wół, 1, mango.
4. M. quesadilla, wół, 1.
`.trim();
      expect(response.text).toContain(expectedText);
    });

    it("should sort items by filling", () => {
      const type = OrderItemType.quesadilla;
      const items = [
        new OrderItem("", author, type, Fillings.chicken, "1", undefined, ""),
        new OrderItem(
          "",
          author,
          type,
          Fillings.vegetables,
          "1",
          undefined,
          "",
        ),
        new OrderItem("", author, type, Fillings.pork, "1", undefined, ""),
        new OrderItem("", author, type, Fillings.beef, "1", undefined, ""),
      ];
      const order = new Order("", "", true, items);

      const response = handleGetSms.responses.getSms(order);

      const expectedText = `
1. M. quesadilla, wół, 1.
2. M. quesadilla, wieprz, 1.
3. M. quesadilla, kura, 1.
4. M. quesadilla, wege, 1.
`.trim();
      expect(response.text).toContain(expectedText);
    });

    it("should sort items by sauce", () => {
      const type = OrderItemType.quesadilla;
      const items = [
        new OrderItem("", author, type, Fillings.pork, "3", undefined, ""),
        new OrderItem("", author, type, Fillings.pork, "2", undefined, ""),
        new OrderItem("", author, type, Fillings.pork, "6", undefined, ""),
        new OrderItem("", author, type, Fillings.pork, "7", undefined, ""),
        new OrderItem("", author, type, Fillings.pork, "1", undefined, ""),
        new OrderItem("", author, type, Fillings.pork, "5", undefined, ""),
        new OrderItem("", author, type, Fillings.pork, "4", undefined, ""),
      ];
      const order = new Order("", "", true, items);

      const response = handleGetSms.responses.getSms(order);

      const expectedText = `
1. M. quesadilla, wieprz, 1.
2. M. quesadilla, wieprz, 2.
3. M. quesadilla, wieprz, 3.
4. M. quesadilla, wieprz, 4.
5. M. quesadilla, wieprz, 5.
6. M. quesadilla, wieprz, 6.
7. M. quesadilla, wieprz, 7.
`.trim();
      expect(response.text).toContain(expectedText);
    });

    it("should sort items by drink", () => {
      const type = OrderItemType.big_burrito;
      const items = [
        new OrderItem(
          "",
          author,
          type,
          Fillings.pork,
          "1",
          Drinks.lemonade,
          "",
        ),
        new OrderItem(
          "",
          author,
          type,
          Fillings.pork,
          "1",
          Drinks.mangolade,
          "",
        ),
        new OrderItem(
          "",
          author,
          type,
          Fillings.pork,
          "1",
          Drinks.lemonade,
          "",
        ),
        new OrderItem(
          "",
          author,
          type,
          Fillings.pork,
          "1",
          Drinks.mangolade,
          "",
        ),
      ];
      const order = new Order("", "", true, items);

      const response = handleGetSms.responses.getSms(order);

      const expectedText = `
1. D. burrito, wieprz, 1, mango.
2. D. burrito, wieprz, 1, mango.
3. D. burrito, wieprz, 1, lemon.
4. D. burrito, wieprz, 1, lemon.
`.trim();
      expect(response.text).toContain(expectedText);
    });
  });
});

describe("receive payment command", () => {
  let testServer = undefined;

  beforeAll(() => {
    testServer = myserver.listen();
  });

  afterAll(() => {
    testServer && testServer.close();
  });

  it("should open receive payment dialog", async () => {
    const payload = makePayload({ text: "receive payment" });
    const expectedResponse = {};

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, expectedResponse);

    expect(openDialog).toHaveBeenCalledWith(
      payload.trigger_id,
      dialogs[CallbackId.receive_payment],
    );
  });
});

describe("balance command", () => {
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

  const payload = makePayload({ text: "balance" });

  it("should work with no orders", async () => {
    const expectedResponse = { text: "Current balance:\n" };

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, expectedResponse);
  });

  it("should work with no order items", async () => {
    const order = await createOrder();
    await closeOrder(order);
    const expectedResponse = { text: "Current balance:\n" };

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, expectedResponse);
  });

  it("should return total price for O[I(a1)]", async () => {
    let order = await createOrder();
    const item = await createOrderItem(order);
    await closeOrder(order);
    order = await refreshOrder(order);

    const amount = readableMoneyAmount(
      item.getPrice() + order.getDeliveryShare(),
    );
    const expectedResponse = {
      text: `Current balance:
1. <@${item.author}> *-${amount} PLN* (-${amount} + 0)`,
    };

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, expectedResponse);
  });

  it("should return total price for O[I(a), I(a)]", async () => {
    let order = await createOrder();
    const item1 = await createOrderItem(order);
    const item2 = await createOrderItem(order, { author: item1.author });
    await closeOrder(order);
    order = await refreshOrder(order);

    const amount = readableMoneyAmount(
      item1.getPrice() + item2.getPrice() + order.getDeliveryShare(),
    );
    const expectedResponse = {
      text: `Current balance:
1. <@${item1.author}> *-${amount} PLN* (-${amount} + 0)`,
    };

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, expectedResponse);
  });

  it("should return two amounts for O[I(a1), I(a2)]", async () => {
    let order = await createOrder();
    const item1 = await createOrderItem(order);
    const item2 = await createOrderItem(order);
    await closeOrder(order);
    order = await refreshOrder(order);

    const amount1 = readableMoneyAmount(
      item1.getPrice() + order.getDeliveryShare(),
    );
    const amount2 = readableMoneyAmount(
      item2.getPrice() + order.getDeliveryShare(),
    );
    const expectedResponse = {
      text: `Current balance:
1. <@${item1.author}> *-${amount1} PLN* (-${amount1} + 0)
2. <@${item2.author}> *-${amount2} PLN* (-${amount2} + 0)`,
    };

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, expectedResponse);
  });

  it("should return total price for O[I(a)] O[I(a)]", async () => {
    let order1 = await createOrder();
    const item1 = await createOrderItem(order1);
    await closeOrder(order1);
    order1 = await refreshOrder(order1);
    let order2 = await createOrder();
    const item2 = await createOrderItem(order2, { author: item1.author });
    await closeOrder(order2);
    order2 = await refreshOrder(order2);

    const amount = readableMoneyAmount(
      item1.getPrice() +
        order1.getDeliveryShare() +
        item2.getPrice() +
        order2.getDeliveryShare(),
    );
    const expectedResponse = {
      text: `Current balance:
1. <@${item1.author}> *-${amount} PLN* (-${amount} + 0)`,
    };

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, expectedResponse);
  });

  it("should return two amounts for O1[I(a1)] O2[I(a2)]", async () => {
    let order1 = await createOrder();
    const item1 = await createOrderItem(order1);
    await closeOrder(order1);
    order1 = await refreshOrder(order1);

    let order2 = await createOrder();
    const item2 = await createOrderItem(order2);
    await closeOrder(order2);
    order2 = await refreshOrder(order2);

    const amount1 = readableMoneyAmount(
      item1.getPrice() + order1.getDeliveryShare(),
    );
    const amount2 = readableMoneyAmount(
      item2.getPrice() + order2.getDeliveryShare(),
    );

    const expectedResponse = {
      text: `Current balance:
1. <@${item1.author}> *-${amount1} PLN* (-${amount1} + 0)
2. <@${item2.author}> *-${amount2} PLN* (-${amount2} + 0)`,
    };

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, expectedResponse);
  });

  it("should return amount for P(a)", async () => {
    const payment = await createPayment();
    const amount = readableMoneyAmount(payment.amount);

    const expectedResponse = {
      text: `Current balance:
1. <@${payment.sender}> *${amount} PLN* (-0 + ${amount})`,
    };

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, expectedResponse);
  });
});
