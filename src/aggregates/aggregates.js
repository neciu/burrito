// @flow strict

import OrderItemType from "OrderItemType";

export class Order {
  id: string;
  date: string;
  isClosed: boolean;
  items: Array<OrderItem>;

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
  }

  getPrice(): number {
    return this.items.reduce((sum, item) => item.getPrice() + sum, 0) + 720;
  }
}

export class OrderItem {
  id: string;
  type: $Keys<typeof OrderItemType>;
  filling: string;
  sauce: string;
  drink: ?string;
  comments: string;

  constructor(
    id: string,
    type: $Keys<typeof OrderItemType>,
    filling: string,
    sauce: string,
    drink: ?string,
    comments: string,
  ) {
    this.id = id;
    this.type = type;
    this.filling = filling;
    this.sauce = sauce;
    this.drink = drink;
    this.comments = comments;
  }

  toSmsString(): string {
    if (this.type === OrderItemType.big_burrito) {
      return "D. burrito, wół, 4, mango.";
    } else {
      return "M. burrito, kura, 6.";
    }
  }

  getPrice(): number {
    if (this.type === OrderItemType.big_burrito) {
      return 1710;
    } else if (this.type === OrderItemType.small_burrito) {
      return 1410;
    } else if (this.type === OrderItemType.double_quesadilla) {
      return 2160;
    } else {
      return 1530;
    }
  }
}
