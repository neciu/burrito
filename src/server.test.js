import supertest from "supertest";

import server from "./server";

describe("server", () => {
  let testServer = undefined;
  beforeAll(() => {
    testServer = server.listen();
  });

  afterAll(() => {
    testServer.close();
  });

  it("POST /slack/burrito should return 200", async () => {
    await supertest(testServer)
      .post("/slack/burrito")
      .expect(200);
  });

  it("POST /slack/burrito should print payload to stdout", async () => {
    const headers = {
      headerKey: "headerValue",
    };
    const payload = {
      payloadKey: "payloadValue",
    };
    const spy = jest.spyOn(console, "info").mockImplementation(() => {});

    await supertest(testServer)
      .post("/slack/burrito")
      .set(headers)
      .send(payload);

    expect(spy).toHaveBeenCalledTimes(2);
  });
});
