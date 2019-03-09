// @flow strict

import uuidv4 from "uuid/v4";
import type { Drink, Filling, Sauce } from "types";
import OrderItemType from "OrderItemType";

export class BaseEvent {
  id: string;
  timestamp: string;
  version: number;
  author: string;

  constructor(author: string) {
    this.id = uuidv4();
    this.timestamp = new Date(Date.now()).toISOString();
    this.version = 1;
    this.author = author;
  }

  toArray(): Array<string> {
    console.error("Unimplemented");
    return [];
  }

  static fromArray(array: Array<string>): BaseEvent {
    console.error("Unimplemented");
    return new BaseEvent("");
  }
}

export class OpenNewOrderEvent extends BaseEvent {
  static eventType: string;
  date: string;

  constructor(author: string, date: string) {
    super(author);
    this.date = date;
  }

  toArray() {
    return [
      this.id,
      this.timestamp,
      OpenNewOrderEvent.eventType,
      String(this.version),
      this.author,
      this.date,
    ];
  }

  static fromArray(array: Array<string>) {
    const [id, timestamp, eventType, version, author, date] = array;
    const event = new OpenNewOrderEvent(author, date);
    event.id = id;
    event.timestamp = timestamp;
    return event;
  }
}

OpenNewOrderEvent.eventType = "open_order";

export class CloseOrderEvent extends BaseEvent {
  static eventType: string;
  date: string;

  constructor(author: string, date: string) {
    super(author);
    this.date = date;
  }

  toArray() {
    return [
      this.id,
      this.timestamp,
      CloseOrderEvent.eventType,
      String(this.version),
      this.author,
      this.date,
    ];
  }

  static fromArray(array: Array<string>) {
    const [id, timestamp, eventType, version, author, date] = array;
    const event = new CloseOrderEvent(author, date);
    event.id = id;
    event.timestamp = timestamp;
    return event;
  }
}

CloseOrderEvent.eventType = "close_order";

export class AddOrderItemEvent extends BaseEvent {
  static eventType: string;
  orderDate: string;
  type: $Keys<typeof OrderItemType>;
  filling: Filling;
  sauce: Sauce;
  drink: ?Drink;
  comments: string;

  constructor(
    author: string,
    orderDate: string,
    type: $Keys<typeof OrderItemType>,
    filling: Filling,
    sauce: Sauce,
    drink: ?Drink,
    comments: string,
  ) {
    super(author);
    this.orderDate = orderDate;
    this.type = type;
    this.filling = filling;
    this.sauce = sauce;
    this.drink = drink;
    this.comments = comments;
  }

  toArray() {
    return [
      this.id,
      this.timestamp,
      AddOrderItemEvent.eventType,
      String(this.version),
      this.author,
      this.orderDate,
      this.type,
      this.filling,
      this.sauce,
      this.drink || "",
      this.comments,
    ];
  }

  static fromArray(array: Array<string>) {
    const [
      id,
      timestamp,
      eventType,
      version,
      author,
      orderDate,
      type,
      filling,
      sauce,
      drink,
      comments,
    ] = array;
    const event = new AddOrderItemEvent(
      author,
      orderDate,
      type,
      filling,
      sauce,
      drink,
      comments,
    );
    event.id = id;
    event.timestamp = timestamp;
    return event;
  }
}

AddOrderItemEvent.eventType = "add_order_item";

export class ReceivePaymentEvent extends BaseEvent {
  static eventType: string;
  sender: string;
  amount: number;
  type: string;
  comments: string;

  constructor(
    author: string,
    sender: string,
    amount: number,
    type: string,
    comments: string,
  ) {
    super(author);
    this.sender = sender;
    this.amount = amount;
    this.type = type;
    this.comments = comments;
  }

  toArray() {
    return [
      this.id,
      this.timestamp,
      ReceivePaymentEvent.eventType,
      String(this.version),
      this.author,
      this.sender,
      String(this.amount),
      this.type,
      this.comments,
    ];
  }

  static fromArray(array: Array<string>) {
    const [
      id,
      timestamp,
      eventType,
      version,
      author,
      sender,
      amount,
      type,
      comments,
    ] = array;
    const event = new ReceivePaymentEvent(
      author,
      sender,
      Number(amount),
      type,
      comments,
    );
    event.id = id;
    event.timestamp = timestamp;
    return event;
  }
}
ReceivePaymentEvent.eventType = "receive_payment";
