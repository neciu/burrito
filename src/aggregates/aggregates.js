// @flow strict

import OrderItemType from "OrderItemType";
import type { Drink, Filling } from "types";
import { Drinks, Fillings } from "types";

export class Order {
  id: string;
  date: string;
  isClosed: boolean;
  items: Array<OrderItem>;

  DELIVERY_COST: number;

  constructor(
    id: string,
    date: string,
    isClosed: boolean,
    items: Array<OrderItem>,
  ) {
    this.id = id;
    this.date = date;
    this.isClosed = isClosed;
    this.items = items;
    this.DELIVERY_COST = 720;
  }

  getPrice(): number {
    return (
      this.items.reduce((sum, item) => item.getPrice() + sum, 0) +
      this.DELIVERY_COST
    );
  }

  getParticipants(): Array<string> {
    return Array.from(
      new Set(
        this.items.reduce(
          (participants, item) => [...participants, item.author],
          [],
        ),
      ),
    );
  }

  getDeliveryShare(): number {
    const numberOfParticipants = this.getParticipants().length;
    return Order.getDeliveryShare(this.DELIVERY_COST, numberOfParticipants);
  }

  static getDeliveryShare(
    deliveryCost: number,
    numberOfParticipants: number,
  ): number {
    return Math.ceil(deliveryCost / 10 / numberOfParticipants) * 10;
  }
}

export class OrderItem {
  id: string;
  author: string;
  type: $Keys<typeof OrderItemType>;
  filling: Filling;
  sauce: string;
  drink: ?Drink;
  comments: string;

  constructor(
    id: string,
    author: string,
    type: $Keys<typeof OrderItemType>,
    filling: Filling,
    sauce: string,
    drink: ?Drink,
    comments: string,
  ) {
    this.id = id;
    this.author = author;
    this.type = type;
    this.filling = filling;
    this.sauce = sauce;
    this.drink = drink;
    this.comments = comments;
  }

  toSmsName(): string {
    return [
      getTypeName(this.type),
      getFillingName(this.filling),
      this.sauce,
      getDrinkName(this.drink),
    ]
      .filter(item => !!item)
      .join(", ")
      .concat(".");
  }

  getPrice(): number {
    if (this.type === OrderItemType.big_burrito) {
      return 1710;
    } else if (this.type === OrderItemType.small_burrito) {
      return 1440;
    } else if (this.type === OrderItemType.double_quesadilla) {
      return 2160;
    } else {
      return 1530;
    }
  }
}

function getTypeName(type: $Keys<typeof OrderItemType>): string {
  return {
    [OrderItemType.big_burrito]: "D. burrito",
    [OrderItemType.small_burrito]: "M. burrito",
    [OrderItemType.double_quesadilla]: "D. quesadilla",
    [OrderItemType.quesadilla]: "M. quesadilla",
  }[type];
}

function getFillingName(filling: Filling): string {
  return {
    [Fillings.beef]: "wół",
    [Fillings.chicken]: "kura",
    [Fillings.pork]: "wieprz",
    [Fillings.vegetables]: "wege",
  }[filling];
}

function getDrinkName(drink: ?Drink): ?string {
  return drink
    ? {
        [Drinks.mangolade]: "mango",
        [Drinks.lemonade]: "lemon",
      }[drink]
    : undefined;
}
