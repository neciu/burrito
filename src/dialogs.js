import OrderItemType from "OrderItemType";
import CallbackId from "CallbackId";
import { Drinks, Fillings } from "types";

const fillingOptions = [
  {
    label: "Beef",
    value: Fillings.beef,
  },
  {
    label: "Pork",
    value: Fillings.pork,
  },
  {
    label: "Chicken",
    value: Fillings.chicken,
  },
  {
    label: "Vegetarian",
    value: Fillings.vegetables,
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
    value: Drinks.mangolade,
  },
  {
    label: "Lemonade",
    value: Drinks.lemonade,
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
    title: "Your Big Burrito",
    submitLabel: "Order",
    state: OrderItemType.big_burrito,
    elements: [fillingElement, sauceElement, drinkElement, commentsElement],
  },
  [OrderItemType.small_burrito]: {
    callbackId: CallbackId.add_order_item,
    title: "Your Small Burrito",
    submitLabel: "Order",
    state: OrderItemType.small_burrito,
    elements: [fillingElement, sauceElement, commentsElement],
  },
  [OrderItemType.quesadilla]: {
    callbackId: CallbackId.add_order_item,
    title: "Your Quesadilla",
    submitLabel: "Order",
    state: OrderItemType.quesadilla,
    elements: [fillingElement, sauceElement, commentsElement],
  },
  [OrderItemType.double_quesadilla]: {
    callbackId: CallbackId.add_order_item,
    title: "Your Double Quesadilla",
    submitLabel: "Order",
    state: OrderItemType.double_quesadilla,
    elements: [fillingElement, sauceElement, drinkElement, commentsElement],
  },
};
