import server from "server/server";
import supertest from "supertest";
import dispatchCommand, { getBurritoDialog } from "dispatchCommand";

jest.mock("dispatchCommand");

describe("POST /slack/actions", () => {
  let testServer = undefined;

  beforeAll(() => {
    testServer = server.listen();
  });

  afterAll(() => {
    testServer.close();
  });

  it("should fire ShowBurritoDialogCommand", async () => {
    const payload = {
      type: "interactive_message",
      callback_id: "item_order",
      actions: [{ name: "orderItem", value: "burrito" }],
      trigger_id: "trigger_id",
    };

    await supertest(testServer)
      .post("/slack/actions")
      .send({ payload: JSON.stringify(payload) })
      .expect(204, {});

    expect(dispatchCommand).toHaveBeenCalledWith({
      command: "showBurritoDialog",
      triggerId: payload.trigger_id,
      dialog: getBurritoDialog(payload.callback_id),
    });
  });

  it("should fire AddOrderItemCommand", async () => {
    const payload = {
      type: "dialog_submission",
      user: {
        name: "mmmm Burrito!",
      },
      callback_id: "item_order",
      submission: {
        filling: "beef",
        sauce: "1",
        drink: "mangolade",
      },
      response_url: "https://lol.kat.zz",
      state: "burrito",
    };
    const result = {
      text: "Order Item added!",
    };
    dispatchCommand.mockResolvedValue(result);

    await supertest(testServer)
      .post("/slack/actions")
      .send({ payload: JSON.stringify(payload) })
      .expect(200, result);

    expect(dispatchCommand).toHaveBeenCalledWith({
      command: "addOrderItem",
      userName: "mmmm Burrito!",
      orderItem: {
        type: "burrito",
        filling: "beef",
        sauce: "1",
        drink: "mangolade",
      },
      responseUrl: "https://lol.kat.zz",
    });
  });
});
