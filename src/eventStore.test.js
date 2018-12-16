// @flow strict

import type { AddOrderItemCommand } from "./dispatchCommand";
import * as eventStore from "./eventStore";

describe("appendEvent", () => {
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
    };
    const mockedResult = { text: "errything is ok!" };
    const spy = jest.fn().mockResolvedValue(mockedResult);

    const result = await eventStore.appendEvent(command, spy);

    expect(result).toEqual(mockedResult);
    expect(spy).toBeCalledWith([
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
