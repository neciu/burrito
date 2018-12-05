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

  it("GET /slack/commands should return 200", async () => {
    await supertest(testServer)
      .get("/slack/commands")
      .expect(200);
  });
});
