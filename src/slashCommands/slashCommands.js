// @flow strict

import dispatchCommand from "dispatchCommand";
import { CommandType } from "commands";
import { KoaCtx } from "types";

export const helpResponse = {
  text:
    "It seems you'd use some help. Please take a look on the list of available commands below:\n- `/burrito order` will present you all current order options,\n- `/burrito help` displays this message.",
};

export default async function handleSlashCommands(ctx: KoaCtx) {
  if (ctx.request.body) {
    const { command, text } = ctx.request.body;

    if (command === "/burrito" && text === "order") {
      ctx.body = await dispatchCommand({
        type: CommandType.show_order_item_buttons,
      });
    } else {
      ctx.body = helpResponse;
    }
  }

  ctx.status = 200;
}
