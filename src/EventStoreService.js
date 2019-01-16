// @flow strict

import uuidv4 from "uuid/v4";

import googleApi from "googleApi";

interface EventStoreInterface {
  openOrder(author: string, date: string): Promise<void>;
  closeOrder(author: string, date: string): Promise<void>;
  addOrderItem(
    author: string,
    orderDate: string,
    type: string,
    filling: string,
    sauce: string,
    drink: ?string,
    comments: string,
  ): Promise<void>;
  getStillOpenedOrdersOpenOrderEvents(): Promise<Array<OpenNewOrderEvent>>;
  getCloseOrderEvents(): Promise<Array<CloseOrderEvent>>;
  getOpenOrderEvent(date: string): Promise<?OpenNewOrderEvent>;
  getAddOrderItemEvents(date: string): Promise<Array<AddOrderItemEvent>>;
}

let eventStore: EventStoreInterface;

class BaseEvent {
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
  type: string;
  filling: string;
  sauce: string;
  drink: ?string;
  comments: string;

  constructor(
    author: string,
    orderDate: string,
    type: string,
    filling: string,
    sauce: string,
    drink: ?string,
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

class BaseEventStore implements EventStoreInterface {
  async getEvents(types: ?Array<string>): Promise<Array<any>> {
    console.error("Unimplemented");
    return [];
  }

  async append(event: BaseEvent): Promise<void> {
    console.error("Unimplemented");
  }

  async openOrder(author: string, date: string) {
    await this.append(new OpenNewOrderEvent(author, date));
  }

  async closeOrder(author: string, date: string) {
    await this.append(new CloseOrderEvent(author, date));
  }

  async addOrderItem(author, orderDate, type, kind, sauce, drink, comments) {
    await this.append(
      new AddOrderItemEvent(
        author,
        orderDate,
        type,
        kind,
        sauce,
        drink,
        comments,
      ),
    );
  }

  async getStillOpenedOrdersOpenOrderEvents() {
    const events = await this.getEvents([
      OpenNewOrderEvent.eventType,
      CloseOrderEvent.eventType,
    ]);
    const openEvents: Array<OpenNewOrderEvent> = events.filter(
      e => e instanceof OpenNewOrderEvent,
    );
    const closeEvents: Array<CloseOrderEvent> = events.filter(
      e => e instanceof CloseOrderEvent,
    );
    const closeEventsDates = closeEvents.map(e => e.date);

    return openEvents.filter(e => !closeEventsDates.includes(e.date));
  }

  async getCloseOrderEvents() {
    return await this.getEvents([CloseOrderEvent.eventType]);
  }

  async getOpenOrderEvent(date: string) {
    const allEvents = await this.getEvents([OpenNewOrderEvent.eventType]);
    return allEvents.find(e => e.date === date);
  }

  async getAddOrderItemEvents(date: string) {
    const allEvents: Array<AddOrderItemEvent> = await this.getEvents([
      AddOrderItemEvent.eventType,
    ]);
    return allEvents.filter(e => e.orderDate === date);
  }
}

export function initializeEventStore() {
  if (process.env.NODE_ENV === "test") {
    let events = [];

    class TestEventStore extends BaseEventStore {
      async getEvents(types) {
        const filteredEvents = types
          ? events.filter(e => types.includes(e[2]))
          : events;
        const typeToBuilder = {
          [OpenNewOrderEvent.eventType]: OpenNewOrderEvent.fromArray,
          [CloseOrderEvent.eventType]: CloseOrderEvent.fromArray,
          [AddOrderItemEvent.eventType]: AddOrderItemEvent.fromArray,
        };

        return filteredEvents.map(e => typeToBuilder[e[2]](e));
      }

      async append(event) {
        events = events.concat([event.toArray()]);
      }
    }

    eventStore = new TestEventStore();
  } else {
    class EventStore extends BaseEventStore {
      async getEvents(types) {
        const request = {
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: "Event Log!A:XX",
        };

        const result = await googleApi.sheetsGet(request);
        const events = result.data.values || [];

        const filteredEvents = types
          ? events.filter(e => types.includes(e[2]))
          : events;
        const typeToBuilder = {
          [OpenNewOrderEvent.eventType]: OpenNewOrderEvent.fromArray,
          [CloseOrderEvent.eventType]: CloseOrderEvent.fromArray,
          [AddOrderItemEvent.eventType]: AddOrderItemEvent.fromArray,
        };

        return filteredEvents.map(e => typeToBuilder[e[2]](e));
      }

      async append(event) {
        const request = {
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: "Event Log!A:A",
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [event.toArray()],
          },
        };

        await googleApi.sheetsAppend(request);
      }
    }
    eventStore = new EventStore();
  }
}

export function getEventStore(): EventStoreInterface {
  return eventStore;
}

export const EventTypes = {
  openNewOrder: "openNewOrder",
  closeOrder: "closeOrder",
};
