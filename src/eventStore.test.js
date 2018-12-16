// @flow strict

import type { AddOrderItemCommand } from "./dispatchCommand";
import * as eventStore from "./eventStore";

describe("appendEvent", () => {
  let now;
  let dateMock;

  beforeAll(() => {
    now = Date.now();
    dateMock = jest.spyOn(global.Date, "now").mockReturnValue(now);
  });

  afterAll(() => {
    dateMock.mockRestore();
  });

  it("should handle AddOrderItemCommand correctly", async () => {
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
    const mockedResult = { text: "errything is ok!" };
    const spy = jest.fn().mockResolvedValue(mockedResult);

    const result = await eventStore.appendEvent(command, spy);

    expect(result).toEqual(mockedResult);
    expect(spy).toBeCalledWith([
      new Date(now).toISOString(),
      "addOrderItem",
      1,
      "My user name",
      "burrito",
      "beef",
      "7",
      "mangolade",
    ]);
  });
});
