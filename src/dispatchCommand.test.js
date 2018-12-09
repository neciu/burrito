import dispatchCommand, { orderResponse } from "./dispatchCommand";

describe("OrderCommand", () => {
  it("should return proper buttons", async () => {
    const command = { author: "author", command: "order" };
    const result = await dispatchCommand(command);

    expect(result).toEqual(orderResponse);
  });
});
