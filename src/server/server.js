// @flow strict

import Koa from "koa";
import koaRoute from "koa-route";
import bodyParser from "koa-bodyparser";
import validateSignature from "../validateSlackSignature";
import { KoaCtx, KoaNext } from "../types";
import { handleActions } from "server/actions";
import { handleSlashCommands } from "slashCommands";

const server = new Koa();
server.use(bodyParser());
server.use(koaRoute.post("/slack/commands", handleSlashCommands));
server.use(koaRoute.post("/slack/actions", handleActions));
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

export default server;
