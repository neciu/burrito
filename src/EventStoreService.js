// @flow strict

import googleApi from "./googleApi";

interface EventStoreInterface {
  openOrder(author: string, date: string): Promise<void>;
  closeOrder(author: string, date: string): Promise<void>;
  getStillOpenedOrdersOpenOrderEvents(): Promise<Array<OpenNewOrderEvent>>;
  getCloseOrderEvents(): Promise<Array<CloseOrderEvent>>;
  getOpenOrderEvent(date: string): Promise<?OpenNewOrderEvent>;
}

let eventStore: EventStoreInterface;

class BaseEvent {
  id: ?string;
  timestamp: ?string;
  version: number;
  author: string;

  constructor(id: ?string, timestamp: ?string, author: string) {
    this.id = id;
    this.timestamp = timestamp;
    this.version = 1;
    this.author = author;
  }

  toArray(): Array<string> {
    console.error("Unimplemented");
    return [];
  }

  static fromArray(array: Array<string>): BaseEvent {
    console.error("Unimplemented");
    return new BaseEvent(null, null, "");
  }
}

export class OpenNewOrderEvent extends BaseEvent {
  static eventType: string;
  date: string;

  constructor(id: ?string, timestamp: ?string, author: string, date: string) {
    super(id, timestamp, author);
    this.date = date;
  }

  toArray() {
    return [
      this.id || "null",
      this.timestamp || "null",
      OpenNewOrderEvent.eventType,
      String(this.version),
      this.author,
      this.date,
    ];
  }

  static fromArray(array: Array<string>) {
    const [id, timestamp, eventType, version, author, date] = array;
    return new OpenNewOrderEvent(id, timestamp, author, date);
  }
}
OpenNewOrderEvent.eventType = "openOrder";

export class CloseOrderEvent extends BaseEvent {
  static eventType: string;
  date: string;

  constructor(id: ?string, timestamp: ?string, author: string, date: string) {
    super(id, timestamp, author);
    this.date = date;
  }

  toArray() {
    return [
      this.id || "null",
      this.timestamp || "null",
      CloseOrderEvent.eventType,
      String(this.version),
      this.author,
      this.date,
    ];
  }

  static fromArray(array: Array<string>) {
    const [id, timestamp, eventType, version, author, date] = array;
    return new CloseOrderEvent(id, timestamp, author, date);
  }
}
CloseOrderEvent.eventType = "closeOrder";

class BaseEventStore implements EventStoreInterface {
  async getEvents(types: ?Array<string>): Promise<Array<any>> {
    console.error("Unimplemented");
    return [];
  }

  async append(event: BaseEvent): Promise<void> {
    console.error("Unimplemented");
  }

  async openOrder(author: string, date: string) {
    await this.append(new OpenNewOrderEvent(null, null, author, date));
  }

  async closeOrder(author: string, date: string) {
    await this.append(new CloseOrderEvent(null, null, author, date));
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
    const event = allEvents.find(e => e.date === date);

    if (event) {
      return new OpenNewOrderEvent(
        event.id,
        event.timestamp,
        event.author,
        event.date,
      );
    } else {
      return undefined;
    }
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
          range: "Class Data!A:XX",
        };

        const result = await googleApi.sheetsGet(request);
        const events = result.data.values;

        const filteredEvents = types
          ? events.filter(e => types.includes(e[2]))
          : events;
        const typeToBuilder = {
          [OpenNewOrderEvent.eventType]: OpenNewOrderEvent.fromArray,
          [CloseOrderEvent.eventType]: CloseOrderEvent.fromArray,
        };

        return filteredEvents.map(e => typeToBuilder[e[2]](e));
      }

      async append(event) {
        const request = {
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: "Class Data!A:A",
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
