// @flow strict
import assert from "assert";
import { Order, OrderItem } from "aggregates/aggregates";
import { getEventStore } from "EventStoreService";
import OrderItemType from "OrderItemType";
import type { Filling, Sauce } from "types";
import { Fillings, Sauces } from "types";

export async function createOrder({
  author,
  date,
}: {
  author: ?string,
  date: ?string,
} = {}): Promise<Order> {
  const a = author || getRandomUser();
  const d =
    date ||
    getRandomDate()
      .toISOString()
      .slice(0, 10);

  await getEventStore().openOrder(a, d);
  const order = await getEventStore().getOrder(d);

  assert(order);

  return order || new Order("", "", false, []);
}

export async function closeOrder(
  order: Order,
  { author }: { author: ?string } = {},
) {
  const a = author || getRandomUser();
  await getEventStore().closeOrder(a, order.date);
}

export async function refreshOrder(order: Order): Promise<Order> {
  const o = await getEventStore().getOrder(order.date);
  assert(o);
  return o || new Order("", "", false, []);
}

export async function createOrderItem(
  order: Order,
  { author }: { author: ?string } = {},
): Promise<OrderItem> {
  return await getEventStore().addOrderItem(
    author || getRandomUser(),
    order.date,
    getRandomType(),
    getRandomFilling(),
    getRandomSauce(),
    undefined,
    "Comment " + getRandomUser(),
  );
}

function getRandomUser() {
  return "U" + String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

function getRandomDate() {
  function randomDate(start, end) {
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()),
    );
  }

  return randomDate(new Date("2018-01-01"), new Date("2019-12-31"));
}

function getRandomType(): $Keys<typeof OrderItemType> {
  const options = Object.values(OrderItemType);
  // $FlowFixMe
  return options[Math.floor(Math.random() * options.length)];
}

function getRandomFilling(): Filling {
  const options = Object.values(Fillings);
  // $FlowFixMe
  return options[Math.floor(Math.random() * options.length)];
}

function getRandomSauce(): Sauce {
  const options = Object.values(Sauces);
  // $FlowFixMe
  return options[Math.floor(Math.random() * options.length)];
}
