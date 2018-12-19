// @flow strict

import uuidv4 from "uuid/v4";
import type { AddOrderItemCommand } from "./dispatchCommand";
import * as eventStore from "./eventStore";

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
      uuid,
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
