// @flow strict

import googleApi from "googleApi";
import { Order, OrderItem } from "aggregates/aggregates";
import {
  AddOrderItemEvent,
  BaseEvent,
  CloseOrderEvent,
  OpenNewOrderEvent,
  ReceivePaymentEvent,
} from "burritoEvents";
import OrderItemType from "OrderItemType";
import type { Drink, Filling, Sauce } from "types";

interface EventStoreInterface {
  openOrder(author: string, date: string): Promise<void>;
  closeOrder(author: string, date: string): Promise<void>;
  addOrderItem(
    author: string,
    orderDate: string,
    type: $Keys<typeof OrderItemType>,
    filling: Filling,
    sauce: Sauce,
    drink: ?Drink,
    comments: string,
  ): Promise<OrderItem>;
  receivePayment(
    author: string,
    sender: string,
    amount: number,
    type: string,
    comments: string,
  ): Promise<void>;
  getStillOpenedOrdersOpenOrderEvents(): Promise<Array<OpenNewOrderEvent>>;
  getCloseOrderEvents(): Promise<Array<CloseOrderEvent>>;
  getOpenOrderEvent(date: string): Promise<?OpenNewOrderEvent>;
  getAddOrderItemEvents(date: string): Promise<Array<AddOrderItemEvent>>;
  getReceivePaymentEvents(): Promise<Array<ReceivePaymentEvent>>;

  getOrder(date: string): Promise<?Order>;
  getClosedOrders(): Promise<Array<Order>>;
}

let eventStore: EventStoreInterface;

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

  async addOrderItem(
    author,
    orderDate,
    type,
    kind,
    sauce,
    drink,
    comments,
  ): Promise<OrderItem> {
    const event: AddOrderItemEvent = new AddOrderItemEvent(
      author,
      orderDate,
      type,
      kind,
      sauce,
      drink,
      comments,
    );
    await this.append(event);
    return new OrderItem(
      event.id,
      event.author,
      event.type,
      event.filling,
      event.sauce,
      event.drink,
      event.comments,
    );
  }

  async receivePayment(author, sender, amount, type, comments) {
    await this.append(
      new ReceivePaymentEvent(author, sender, amount, type, comments),
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

  async getReceivePaymentEvents() {
    return await this.getEvents([ReceivePaymentEvent.eventType]);
  }

  async getOrder(date) {
    const events = await this.getEvents([
      OpenNewOrderEvent.eventType,
      CloseOrderEvent.eventType,
      AddOrderItemEvent.eventType,
    ]);
    const openEvents: Array<OpenNewOrderEvent> = events.filter(
      e => e instanceof OpenNewOrderEvent,
    );
    const closeEvents: Array<CloseOrderEvent> = events.filter(
      e => e instanceof CloseOrderEvent,
    );

    const openEvent = openEvents.find(e => e.date === date);
    const closeEvent = closeEvents.find(e => e.date === date);

    if (openEvent) {
      const isClosed = !!closeEvent;
      const items = getOrderItemsFromEventsForDate(events, date);

      return new Order(openEvent.id, date, isClosed, items);
    } else {
      return undefined;
    }
  }

  async getClosedOrders() {
    const events = await this.getEvents([
      OpenNewOrderEvent.eventType,
      CloseOrderEvent.eventType,
      AddOrderItemEvent.eventType,
    ]);
    const openEvents: Array<OpenNewOrderEvent> = events.filter(
      e => e instanceof OpenNewOrderEvent,
    );
    const closeEvents: Array<CloseOrderEvent> = events.filter(
      e => e instanceof CloseOrderEvent,
    );
    const closeEventsDates = closeEvents.map(e => e.date);

    return openEvents
      .filter(e => closeEventsDates.includes(e.date))
      .map(openOrderEvent => {
        const items = getOrderItemsFromEventsForDate(
          events,
          openOrderEvent.date,
        );
        return new Order(openOrderEvent.id, openOrderEvent.date, true, items);
      });
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
          [ReceivePaymentEvent.eventType]: ReceivePaymentEvent.fromArray,
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

function getOrderItemsFromEventsForDate(events, date) {
  return events
    .filter(e => e instanceof AddOrderItemEvent)
    .filter(e => e.orderDate === date)
    .map(
      e =>
        new OrderItem(
          e.id,
          e.author,
          e.type,
          e.filling,
          e.sauce,
          e.drink,
          e.comments,
        ),
    );
}
