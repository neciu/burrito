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
import { getEventStore, initializeEventStore } from "EventStoreService";

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

  it.each`
    text                          | expectedStatus | expectedResponse
    ${"help"}                     | ${200}         | ${helpResponse}
    ${"definitely wrong command"} | ${200}         | ${helpResponse}
    ${"order"}                    | ${200}         | ${orderResponse}
  `(
    "should return proper status code and response for $text",
    async ({ text, expectedStatus, expectedResponse }) => {
      const payload = makePayload({ text });

      await supertest(testServer)
        .post("/slack/commands")
        .send(payload)
        .expect(expectedStatus, expectedResponse);
    },
  );
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
    let events = await getEventStore().getEvents({ type: "openNewOrder" });
    expect(events.length).toEqual(0);

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, getNewOrderOkResponse("2019-01-01"));

    events = await getEventStore().getEvents({ type: "openNewOrder" });
    expect(events[0]).toEqual({
      type: "openNewOrder",
      author: "U1337",
      orderDate: "2019-01-01",
    });
  });

  it("should not append the event when there is an existing event with the same date", async () => {
    getEventStore().append({
      type: "openNewOrder",
      author: "lol",
      orderDate: "2019-01-01",
    });
    const payload = makePayload({ text: "open new order 2019-01-01" });
    let events = await getEventStore().getEvents({ type: "openNewOrder" });
    expect(events.length).toEqual(1);

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, getNewOrderDateCollidingResponse("2019-01-01"));

    events = await getEventStore().getEvents({ type: "openNewOrder" });
    expect(events.length).toEqual(1);
    expect(events[0]).toEqual({
      type: "openNewOrder",
      author: "lol",
      orderDate: "2019-01-01",
    });
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
    getEventStore().append({
      type: "openNewOrder",
      author: "U1337",
      orderDate: "2019-01-01",
    });
    const payload = makePayload({ text: "close order 2019-01-01" });

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200);

    const events = await getEventStore().getEvents({ type: "closeOrder" });
    expect(events.length).toEqual(1);
    expect(events[0]).toEqual({
      type: "closeOrder",
      author: "U1337",
      orderDate: "2019-01-01",
    });
  });

  it("should not append event then the order is not opened", async () => {
    const payload = makePayload({ text: "close order 2019-01-01" });

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200);

    const events = await getEventStore().getEvents({ type: "closeOrder" });
    expect(events.length).toEqual(0);
  });

  it("should not append event then the order is already closed", async () => {
    getEventStore().append({
      type: "closeOrder",
      author: "U1337",
      orderDate: "2019-01-01",
    });
    const payload = makePayload({ text: "close order 2019-01-01" });
    let events = await getEventStore().getEvents({ type: "closeOrder" });
    expect(events.length).toEqual(1);

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200);

    events = await getEventStore().getEvents({ type: "closeOrder" });
    expect(events.length).toEqual(1);
  });
});
