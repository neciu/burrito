// @flow strict

let eventStore;

export function initializeEventStore() {
  if (process.env.NODE_ENV === "test") {
    let events = [];

    eventStore = {
      getEvents: function getEvents(params: {}): Array<{}> {
        const paramKeys = Object.keys(params);
        return events.filter(e =>
          paramKeys.every(key => e[key] === params[key]),
        );
      },
      append: function append(event: {}): void {
        events = events.concat(event);
      },
    };
  }
}

export function getEventStore() {
  return eventStore;
}
