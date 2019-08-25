// @flow strict

import { Order, Payment } from "aggregates/aggregates";
import { getEventStore } from "EventStoreService";

export async function getTotalOrders() {
  const orders: Array<Order> = await getEventStore().getClosedOrders();
  return orders
    .reduce(
      (acc, order) => [
        ...acc,
        ...order
          .getParticipants()
          .map(participant => [participant, order.getDeliveryShare()]),
        ...order.items.map(item => [item.author, item.getPrice()]),
      ],
      [],
    )
    .reduce(
      (acc, [author, price]) => ({
        ...acc,
        [author]: (acc[author] || 0) + price,
      }),
      {},
    );
}

export async function getTotalPayments() {
  const payments: Array<Payment> = await getEventStore().getPayments();
  return payments.reduce(
    (acc, payment) => ({
      ...acc,
      [payment.sender]: (acc[payment.sender] || 0) + payment.amount,
    }),
    {},
  );
}

export function readableMoneyAmount(number: number): string {
  return String(number / 100).replace(".", ",");
}
