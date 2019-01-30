// @flow strict

import { openDialog, respond } from "slackApi";
import type { Dialog } from "types";
import { appendEvent } from "eventStore";
import type {
  AddOrderItemCommand,
  ShowOrderItemButtonsCommand,
  ShowOrderItemDialogCommand,
} from "commands";
import { CommandType } from "commands";
import OrderItemType from "OrderItemType";
import dialogs from "dialogs";
import { Drinks, Fillings } from "types";

export const orderResponse = {
  attachments: [
    {
      text: "Choose your destiny :burrito: :fiestaparrot:",
      callback_id: "item_order",
      actions: [
        {
          name: "orderItem",
          text: "Burrito",
          type: "button",
          value: OrderItemType.big_burrito,
        },
        {
          name: "orderItem",
          text: "Small burrito",
          type: "button",
          value: OrderItemType.small_burrito,
        },
        {
          name: "orderItem",
          text: "Quesadilla",
          type: "button",
          value: OrderItemType.quesadilla,
        },
        {
          name: "orderItem",
          text: "Double Quesadilla",
          type: "button",
          value: OrderItemType.double_quesadilla,
        },
      ],
    },
  ],
};

export function getBurritoDialog(callbackId: string): Dialog {
  return {
    callbackId: callbackId,
    title: "Order Burrito",
    submitLabel: "Order",
    state: "burrito",
    elements: [
      {
        label: "Filling",
        type: "select",
        name: "filling",
        options: [
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
        ],
      },
      {
        label: "Sauce",
        type: "select",
        name: "sauce",
        options: [
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
        ],
      },
      {
        label: "Drink",
        type: "select",
        name: "drink",
        options: [
          {
            label: "Mangolade",
            value: Drinks.mangolade,
          },
          {
            label: "Lemonade",
            value: Drinks.lemonade,
          },
        ],
      },
    ],
  };
}
export default async function dispatchCommand(
  // eslint-disable-next-line prettier/prettier
	command: ShowOrderItemButtonsCommand
    | ShowOrderItemDialogCommand
    | AddOrderItemCommand,
): {} {
  switch (command.type) {
    case CommandType.show_order_item_buttons:
      return orderResponse;
    case CommandType.show_order_item_dialog: {
      await openDialog(command.triggerId, dialogs[command.itemType]);
      break;
    }
    case CommandType.add_order_item: {
      await appendEvent(command);
      await respond(
        command.responseUrl,
        getResponseMessage(
          command.item.type,
          command.item.filling,
          command.item.sauce,
          command.item.drink,
        ),
      );
      break;
    }
  }
}

function getResponseMessage(
  type: $Keys<typeof OrderItemType>,
  filling: string,
  sauce: string,
  drink?: string,
): string {
  const dishName = {
    [OrderItemType.big_burrito]: "big burrito",
    [OrderItemType.small_burrito]: "small burrito",
    [OrderItemType.quesadilla]: "quesadilla",
    [OrderItemType.double_quesadilla]: "double quesadilla",
  }[type];
  const fillingName = {
    [Fillings.beef]: "beef",
    [Fillings.pork]: "pork",
    [Fillings.chicken]: "chicken",
    [Fillings.vegetables]: "vegetables",
  }[filling];
  const sauceName = {
    "1": "mild salsa",
    "2": "hot salsa",
    "3": "chipottle",
    "4": "piri-piri",
    "5": "habanero",
    "6": "naga jolokia",
    "7": "killer",
  }[sauce];

  const prefix = ":white_check_mark: You have ordered: ";
  const orderName = drink
    ? `${dishName} with ${fillingName}, ${sauceName} sauce (${sauce}) and ${drink}`
    : `${dishName} with ${fillingName} and ${sauceName} sauce (${sauce})`;
  return prefix + orderName;
}
