// @flow strict

import Koa from "koa";
import koaRoute from "koa-route";
import bodyParser from "koa-bodyparser";
import validateSignature from "validateSlackSignature";
import { KoaCtx, KoaNext } from "types";
import { handleActions } from "myserver/actions";
import { handleSlashCommands } from "slashCommands";

const myserver = new Koa();
myserver.use(bodyParser());
if (process.env.NODE_ENV !== "test") {
  myserver.use(slackAuthenticator);
}

myserver.use(koaRoute.post("/slack/actions", handleActions));
myserver.use(koaRoute.post("/slack/commands", handleSlashCommands));

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
    console.error("Error in validating signature. More below.");
    console.error(error);
    ctx.status = 403;
  }
}

export default myserver;
