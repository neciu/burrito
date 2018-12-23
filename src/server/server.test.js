import supertest from "supertest";

import server, { slackAuthenticator } from "./server";
import validateSlackSignature from "../validateSlackSignature";
import dispatchCommand from "../dispatchCommand";
import { CommandType } from "commands";

jest.mock("validateSlackSignature");
jest.mock("dispatchCommand");

describe("server", () => {
  let testServer = undefined;

  beforeAll(() => {
    testServer = server.listen();
    jest.spyOn(console, "info").mockImplementation(() => {});
  });

  afterAll(() => {
    testServer.close();
    console.info.mockRestore();
  });

  afterEach(() => {
    console.info.mockClear();
    dispatchCommand.mockRestore();
  });

  it("POST /slack/commands should return 200", async () => {
    await supertest(testServer)
      .post("/slack/commands")
      .expect(200);
  });

  it("POST /slack/commands should print payload to stdout", async () => {
    const headers = {
      headerKey: "headerValue",
    };
    const payload = {
      payloadKey: "payloadValue",
    };
    const spy = jest.spyOn(console, "info");

    await supertest(testServer)
      .post("/slack/commands")
      .set(headers)
      .send(payload);

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("POST /slack/commands should dispatch order command", async () => {
    const payload = {
      user_name: "user.name",
      command: "/burrito",
      text: "order",
      response_url: "https://hooks.slack.com/commands/XXXXYYYY/ZZZZ/AAAABBBB",
    };
    const command = {
      type: CommandType.show_order_item_buttons,
    };

    dispatchCommand.mockResolvedValue({ text: "Response from dispatch" });

    await supertest(testServer)
      .post("/slack/commands")
      .send(payload)
      .expect(200, {
        text: "Response from dispatch",
      });

    expect(dispatchCommand).toHaveBeenCalledWith(command);
  });
});

describe("slackAuthenticator", () => {
  let ctx = undefined;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    process.env.SLACK_SIGNING_SECRET = "secret";
    ctx = {
      headers: {
        "x-slack-signature": "signature",
        "x-slack-request-timestamp": "1234",
      },
      request: {
        rawBody: "body",
      },
    };
  });

  it("should pass all required parameters to 'validateSignature'", async () => {
    await slackAuthenticator(ctx, () => {});

    expect(validateSlackSignature).toBeCalledWith({
      timestamp: "1234",
      body: "body",
      secret: "secret",
      signature: "signature",
    });
  });

  it("should set 403 error and shouldn't call next when validateSlackSignature throws", async () => {
    validateSlackSignature.mockImplementation(() => {
      throw new Error();
    });
    const nextSpy = jest.fn();

    await slackAuthenticator(ctx, nextSpy);

    expect(ctx).toHaveProperty("status", 403);
    expect(nextSpy).not.toBeCalled();
  });

  it("should call next when validateSlackSignature passes", async () => {
    validateSlackSignature.mockImplementation(() => {});
    const nextSpy = jest.fn();

    await slackAuthenticator(ctx, nextSpy);

    expect(nextSpy).toBeCalled();
  });
});
