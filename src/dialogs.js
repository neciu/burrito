import OrderItemType from "OrderItemType";
import CallbackId from "CallbackId";

const fillingOptions = [
  {
    label: "Beef",
    value: "beef",
  },
  {
    label: "Pork",
    value: "pork",
  },
  {
    label: "Chicken",
    value: "chicken",
  },
  {
    label: "Vegetarian",
    value: "vegetarian",
  },
];

const sauceOptions = [
  {
    label: "1. Mild salsa",
    value: "1",
  },
  {
    label: "2. Hot salsa",
    value: "2",
  },
  {
    label: "3. Chipottle",
    value: "3",
  },
  {
    label: "4. Piri-piri",
    value: "4",
  },
  {
    label: "5. Habanero",
    value: "5",
  },
  {
    label: "6. Naga Jolokia",
    value: "6",
  },
  {
    label: "7. Killer",
    value: "7",
  },
];

const drinkOptions = [
  {
    label: "Mangolade",
    value: "mangolade",
  },
  {
    label: "Lemonade",
    value: "lemonade",
  },
];

let fillingElement = {
  label: "Filling",
  type: "select",
  name: "filling",
  options: fillingOptions,
};

let sauceElement = {
  label: "Sauce",
  type: "select",
  name: "sauce",
  options: sauceOptions,
};

let drinkElement = {
  label: "Drink",
  type: "select",
  name: "drink",
  options: drinkOptions,
};

let commentsElement = {
  label: "Comments",
  type: "textarea",
  name: "comments",
  optional: "true",
};

export default {
  [OrderItemType.big_burrito]: {
    callbackId: CallbackId.add_order_item,
    title: "Compose Your Big Burrito",
    submitLabel: "Order",
    state: OrderItemType.big_burrito,
    elements: [fillingElement, sauceElement, drinkElement, commentsElement],
  },
  [OrderItemType.small_burrito]: {
    callbackId: CallbackId.add_order_item,
    title: "Compose Your Small Burrito",
    submitLabel: "Order",
    state: OrderItemType.small_burrito,
    elements: [fillingElement, sauceElement, commentsElement],
  },
  [OrderItemType.quesadilla]: {
    callbackId: CallbackId.add_order_item,
    title: "Compose Your Quesadilla",
    submitLabel: "Order",
    state: OrderItemType.quesadilla,
    elements: [fillingElement, sauceElement, commentsElement],
  },
  [OrderItemType.double_quesadilla]: {
    callbackId: CallbackId.add_order_item,
    title: "Compose Your Double Quesadilla",
    submitLabel: "Order",
    state: OrderItemType.double_quesadilla,
    elements: [fillingElement, sauceElement, drinkElement, commentsElement],
  },
};
