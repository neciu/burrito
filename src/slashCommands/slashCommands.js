// @flow strict

import dispatchCommand from "dispatchCommand";
import { CommandType } from "commands";
import { KoaCtx } from "types";
import { DateTime } from "luxon";
import { getEventStore } from "EventStoreService";

export const helpResponse = {
  text:
    "It seems you'd use some help. Please take a look on the list of " +
    "available commands below:\n- `/burrito order` will present you all " +
    "current order options,\n- `/burrito help` displays this message.",
};

export const openNewOrderWrongOrMissingDateResponse = {
  text:
    "Wrong or missing date. Try again with `/burrito open new order " +
    "[yyyy-mm-dd]`.",
};

export function getNewOrderOkResponse(date: string): { text: string } {
  return { text: `New order (${date}) opened.` };
}

export function getNewOrderDateCollidingResponse(
  date: string,
): { text: string } {
  return {
    text: `Order with this date (${date}) already exists. Doing nothing.`,
  };
}

export default async function handleSlashCommands(ctx: KoaCtx) {
  if (ctx.request.body) {
    const { command, text, user_id: userId } = ctx.request.body;

    if (command === "/burrito" && text === "order") {
      ctx.body = await handleOrder();
    } else if (
      command === "/burrito" &&
      userId &&
      text &&
      text.startsWith("open new order")
    ) {
      ctx.body = await handleNewOrder(text, userId);
    } else if (
      command === "/burrito" &&
      userId &&
      text &&
      text.startsWith("close order")
    ) {
      await handleCloseOrder(text, userId);
    } else {
      ctx.body = helpResponse;
    }
  }

  ctx.status = 200;
}

async function handleOrder() {
  const openEvents = await getEventStore().getStillOpenedOrdersOpenOrderEvents();

  if (openEvents.length === 0) {
    return {
      text: "There is no opened order. Ask somebody for help if needed.",
    };
  } else {
    return await dispatchCommand({
      type: CommandType.show_order_item_buttons,
    });
  }
}

async function handleNewOrder(
  text: string,
  userId: string,
): Promise<{ text: string }> {
  const unformattedDate = text.replace("open new order ", "").trim();
  const date = DateTime.fromISO(unformattedDate);

  if (!date.isValid) {
    return openNewOrderWrongOrMissingDateResponse;
  } else {
    return await storeOpenNewOrderEvent(date.toISODate(), userId);
  }
}

async function storeOpenNewOrderEvent(date: string, userId: string) {
  const event = await getEventStore().getOpenOrderEvent(date);

  if (event) {
    return getNewOrderDateCollidingResponse(date);
  } else {
    await getEventStore().openOrder(userId, date);
    return getNewOrderOkResponse(date);
  }
}

async function handleCloseOrder(command: string, userId: string) {
  const date = command.replace("close order ", "");

  const event = await getEventStore().getOpenOrderEvent(date);

  if (event) {
    await getEventStore().closeOrder(userId, date);
  } else {
  }
}