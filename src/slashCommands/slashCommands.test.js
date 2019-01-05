// @flow strict

import supertest from "supertest";
import server from "server";
import { orderResponse } from "dispatchCommand";
import { helpResponse } from "slashCommands/slashCommands";

describe("order command", () => {
  let testServer = undefined;

  beforeAll(() => {
    testServer = server.listen();
  });

  afterAll(() => {
    testServer && testServer.close();
  });

  it.each`
    command       | text                          | expectedStatus | expectedResponse
    ${"/burrito"} | ${"help"}                     | ${200}         | ${helpResponse}
    ${"/burrito"} | ${"definitely wrong command"} | ${200}         | ${helpResponse}
    ${"/burrito"} | ${"order"}                    | ${200}         | ${orderResponse}
  `(
    "should return proper status code and response for $command $text",
    async ({ command, text, expectedStatus, expectedResponse }) => {
      const payload = {
        command: command,
        text: text,
      };

      await supertest(testServer)
        .post("/slack/commands")
        .send(payload)
        .expect(expectedStatus, expectedResponse);
    },
  );
});
