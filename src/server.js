// @flow strict

import Koa from "koa";
import bodyParser from "koa-bodyparser";
import validateSignature from "./validateSlackSignature";
import { KoaCtx, KoaNext } from "./types";
import dispatchCommand from "./dispatchCommand";

const server = new Koa();
server.use(bodyParser());
if (process.env.NODE_ENV !== "test") {
  server.use(slackAuthenticator);
}

export async function slackAuthenticator(ctx: KoaCtx, next: typeof KoaNext) {
  const parameters = {
    timestamp: ctx.headers["x-slack-request-timestamp"],
    signature: ctx.headers["x-slack-signature"],
    body: ctx.request.rawBody,
    secret: process.env.SLACK_SIGNING_SECRET || undefined,
  };

  try {
    validateSignature(parameters);
    await next();
  } catch (error) {
    console.error(error);
    ctx.status = 403;
  }
}

server.use(async ctx => {
  ctx.body = "Hello World";

  console.info("Headers", ctx.request.headers);
  console.info("Payload", ctx.request.body);

  const {
    user_name: userName,
    command,
    text,
    response_url: responseUrl,
  } = ctx.request.body;

  if (command === "/burrito" && text === "order") {
    ctx.body = await dispatchCommand({
      author: userName,
      command: "order",
      responseUrl: responseUrl,
    });
  }
});

export default server;
