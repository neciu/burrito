// @flow strict

import Koa from "koa";

const server = new Koa();

server.use(async ctx => {
  ctx.body = "Hello World";
});

export default server;
