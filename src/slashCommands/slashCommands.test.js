// @flow strict

import supertest from "supertest";
import server from "server";
import { orderResponse } from "dispatchCommand";
import {
  getNewOrderDateCollidingResponse,
  getNewOrderOkResponse,
  helpResponse,
  openNewOrderWrongOrMissingDateResponse,
} from "slashCommands/slashCommands";
import {
  CloseOrderEvent,
  getEventStore,
  initializeEventStore,
  OpenNewOrderEvent,
} from "EventStoreService";

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
    testServer = server.listen();
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
    testServer = server.listen();
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
    testServer = server.listen();
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