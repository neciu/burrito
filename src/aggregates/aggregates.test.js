// @flow strict

import { Order } from "aggregates/aggregates";

describe("Order", () => {
  it.each`
    numberOfPeople | expectedShare
    ${1}           | ${720}
    ${2}           | ${360}
    ${3}           | ${240}
    ${4}           | ${180}
    ${5}           | ${150}
    ${6}           | ${120}
    ${7}           | ${110}
    ${8}           | ${90}
    ${9}           | ${80}
    ${10}          | ${80}
    ${20}          | ${40}
    ${25}          | ${30}
    ${27}          | ${30}
    ${29}          | ${30}
  `(
    "getDeliveryShare should round up properly",
    ({ numberOfPeople, expectedShare }) => {
      const result = Order.getDeliveryShare(720, numberOfPeople);

      expect(result).toEqual(expectedShare);
    },
  );
});
