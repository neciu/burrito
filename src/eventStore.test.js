// @flow strict

import uuidv4 from "uuid/v4";
import * as eventStore from "./eventStore";
import type { AddOrderItemCommand } from "commands";
import { CommandType } from "commands";
import OrderItemType from "OrderItemType";
import { getEventStore, initializeEventStore } from "EventStoreService";

jest.mock("uuid/v4");

describe("appendEvent", () => {
  let now;
  let dateMock;
  const uuid = "3a017fc5-4f50-4db9-b0ce-4547ba0a1bfd";

  beforeAll(() => {
    now = Date.now();
    dateMock = jest.spyOn(global.Date, "now").mockReturnValue(now);
    uuidv4.mockReturnValue(uuid);
  });

  afterAll(() => {
    dateMock.mockRestore();
    uuidv4.mockRestore();
  });

  beforeEach(() => {
    initializeEventStore();
  });

  it.each`
    userName           | itemType                           | filling         | sauce  | drink         | comments           | expectedValues
    ${"mr.john.smith"} | ${OrderItemType.big_burrito}       | ${"beef"}       | ${"1"} | ${"lemonade"} | ${"I like tacos!"} | ${["mr.john.smith", "2019-01-01", OrderItemType.big_burrito, "beef", "1", "lemonade", "I like tacos!"]}
    ${"admin1"}        | ${OrderItemType.quesadilla}        | ${"vegetarian"} | ${"4"} | ${undefined}  | ${""}              | ${["admin1", "2019-01-01", OrderItemType.quesadilla, "vegetarian", "4", "", ""]}
    ${"admin2"}        | ${OrderItemType.double_quesadilla} | ${"pork"}       | ${"7"} | ${undefined}  | ${"I like tacos!"} | ${["admin2", "2019-01-01", OrderItemType.double_quesadilla, "pork", "7", "", "I like tacos!"]}
  `(
    "should handle AddOrderItemCommand with $userName $itemType $filling $sauce $drink $comments",
    async ({
      userName,
      itemType,
      filling,
      sauce,
      drink,
      comments,
      expectedValues,
    }) => {
      const command: AddOrderItemCommand = {
        type: CommandType.add_order_item,
        responseUrl: "https://lol.kat.zz",
        userName: userName,
        item: {
          type: itemType,
          filling: filling,
          sauce: sauce,
          drink: drink,
          comments: comments,
        },
      };
      const mockedResult = { text: "errything is ok!" };
      const spy = jest.fn().mockResolvedValue(mockedResult);
      await getEventStore().openOrder("U1337", "2019-01-01");

      const result = await eventStore.appendEvent(command, spy);

      expect(result).toEqual(mockedResult);
      expect(spy).toBeCalledWith([
        uuid,
        new Date(now).toISOString(),
        CommandType.add_order_item,
        1,
        ...expectedValues,
      ]);
    },
  );
});
