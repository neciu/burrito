import supertest from "supertest";

import server from "./server";

it("GET /slack/commands should return 200", async () => {
  const testServer = server.listen(8081);
  await supertest(testServer)
    .get("/slack/commands")
    .expect(200);
});
