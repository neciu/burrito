// @flow strict

import dispatchCommand from "dispatchCommand";
import { CommandType } from "commands";
import { KoaCtx } from "types";
import { DateTime } from "luxon";
import { getEventStore } from "EventStoreService";
import { Order, OrderItem } from "aggregates/aggregates";
import fillTemplate from "es6-dynamic-template";
import OrderItemType from "OrderItemType";
import { openDialog } from "slackApi";
import dialogs from "dialogs";
import CallbackId from "CallbackId";
import {
  getTotalOrders,
  getTotalPayments,
  readableMoneyAmount,
} from "eventStoreUtils";

export const helpResponse = {
  text: `It seems you'd use some help. Please take a look on the list of available commands below:
- \`/burrito order\` presents you all current order options,
- \`/burrito show order\` lists all order items for current order,
- \`/burrito balance\` lists balance for all people,
- \`/burrito help\` displays this message.`,
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
    } else if (
      command === "/burrito" &&
      userId &&
      text &&
      text.startsWith("show order")
    ) {
      ctx.body = await handleShowOrder(text);
    } else if (
      command === "/burrito" &&
      userId &&
      text &&
      text.startsWith("get sms")
    ) {
      ctx.body = await handleGetSms(text);
    } else if (
      command === "/burrito" &&
      text &&
      text.startsWith("receive payment")
    ) {
      const { trigger_id: triggerId } = ctx.request.body;
      await openDialog(triggerId, dialogs[CallbackId.receive_payment]);
      ctx.body = "";
    } else if (command === "/burrito" && text && text.startsWith("balance")) {
      ctx.body = await handleBalance();
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

async function handleShowOrder(command: string) {
  const openEvents = await getEventStore().getStillOpenedOrdersOpenOrderEvents();

  if (openEvents.length === 0) {
    return {
      text: "There is no opened order. Ask somebody for help if needed.",
    };
  } else {
    const orderDate = openEvents[0].date;
    const items = await getEventStore().getAddOrderItemEvents(orderDate);
    return {
      text: `Items of the current order (${orderDate}):
${items
        .map(
          (item, index) =>
            `${index + 1}. <@${item.author}>, ${item.type}, ${item.filling}, ${
              item.sauce
            }, ${item.drink || ""}, ${item.comments || ""}`,
        )
        .join("\n")}`,
    };
  }
}

export async function handleGetSms(command: string) {
  const date = extractDateFromCommand("get sms", command);

  if (date) {
    const order = await getEventStore().getOrder(date);
    if (order) {
      return handleGetSms.responses.getSms(order);
    } else {
      return handleGetSms.responses.noOrder(date);
    }
  } else {
    return handleGetSms.responses.missingOrWrongDate();
  }
}

handleGetSms.responses = {
  noOrder: (date: string) => ({
    text: `No order for specified date: \`${date}\`.`,
  }),
  missingOrWrongDate: () => ({
    text:
      "Missing or wrong date provided. Use `/burrito get sms [yyyy-mm-dd]`.",
  }),
  getSms: (order: Order) => ({
    text: fillTemplate(process.env.SMS_TEMPLATE, {
      date: order.date,
      items: order.items
        .sort(itemComparator)
        .map((item, index) => `${index + 1}. ${item.toSmsName()}`)
        .join("\n"),
      price: dotToComma(order.getPrice() / 100),
    }),
  }),
};

function extractDateFromCommand(
  commandPrefix: string,
  command: string,
): ?string {
  const dateCandidate = command.replace(commandPrefix + " ", "").trim();
  const date = DateTime.fromISO(dateCandidate);
  return date.isValid ? date.toISODate() : undefined;
}

function itemComparator(a: OrderItem, b: OrderItem): number {
  const typeScore = {
    [OrderItemType.big_burrito]: 1000,
    [OrderItemType.small_burrito]: 2000,
    [OrderItemType.double_quesadilla]: 3000,
    [OrderItemType.quesadilla]: 4000,
  };

  const fillingScore = {
    beef: 100,
    pork: 200,
    chicken: 300,
    vegetables: 400,
  };

  const drinkScore = {
    mangolade: 1,
    lemonade: 2,
  };

  const aScore =
    typeScore[a.type] +
    fillingScore[a.filling] +
    parseInt(a.sauce) * 10 +
    (a.drink ? drinkScore[a.drink] : 0);
  const bScore =
    typeScore[b.type] +
    fillingScore[b.filling] +
    parseInt(b.sauce) * 10 +
    (b.drink ? drinkScore[b.drink] : 0);

  return aScore - bScore;
}

async function handleBalance() {
  const orders = await getTotalOrders();
  const payments = await getTotalPayments();

  const allAuthors = Array.from(
    new Set([...Object.keys(orders), ...Object.keys(payments)]),
  );

  const balance2 = allAuthors.reduce(
    (acc, user) => ({
      ...acc,
      [user]: {
        orders: orders[user] || 0,
        payments: payments[user] || 0,
      },
    }),
    {},
  );

  const list = allAuthors.map((author: string, index) => {
    const o = balance2[author].orders;
    const p = balance2[author].payments;
    const delta = p - o;

    const oStr = readableMoneyAmount(o);
    const pStr = readableMoneyAmount(p);
    const dStr = readableMoneyAmount(delta);

    return `${index + 1}. <@${author}> *${dStr} PLN* (-${oStr} + ${pStr})`;
  });

  return {
    text: `Current balance:\n${list.join("\n")}`,
  };
}

function dotToComma(withDot: number): string {
  return String(withDot).replace(".", ",");
}
