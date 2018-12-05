// @flow strict

import Koa from "koa";
import bodyParser from "koa-bodyparser";

const server = new Koa();
server.use(bodyParser());

server.use(async ctx => {
  ctx.body = "Hello World";

  console.info("Headers", ctx.request.headers);
  console.info("Payload", ctx.request.body);
});

export default server;
