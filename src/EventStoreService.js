// @flow strict

import googleApi from "./googleApi";

let eventStore;

export function initializeEventStore() {
  if (process.env.NODE_ENV === "test") {
    let events = [];

    eventStore = {
      getEvents: async function getEvents(params: {}): Promise<Array<{}>> {
        const paramKeys = Object.keys(params);
        return events.filter(e =>
          paramKeys.every(key => e[key] === params[key]),
        );
      },
      append: function append(event: {}): void {
        events = events.concat(event);
      },
    };
  } else {
    eventStore = {
      getEvents: async function getEvents(params: {}): Promise<Array<{}>> {
        const request = {
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: "Class Data!A:XX",
        };

        const result = await googleApi.sheetsGet(request);
        const events = result.data.values;
        console.info({ events });

        return [];
      },
      append: async function append(event: {}): Promise<void> {
        // events = events.concat(event);
      },
    };
  }
}

export function getEventStore() {
  return eventStore;
}

export const EventTypes = {
  openNewOrder: "openNewOrder",
  closeOrder: "closeOrder",
};
