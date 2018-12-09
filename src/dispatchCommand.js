// @flow strict

import slackDialogOpener from "./slackDialogOpener";
import type { Dialog } from "./types";

declare type OrderCommand = {
  author: string,
  command: "order",
};

declare type ShowBurritoDialogCommand = {
  command: "showBurritoDialog",
  triggerId: string,
  dialog: Dialog,
};

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
          value: "burrito",
        },
        {
          name: "orderItem",
          text: "Small burrito",
          type: "button",
          value: "burrito-small",
        },
        {
          name: "orderItem",
          text: "Quesadilla",
          type: "button",
          value: "quesadilla",
        },
        {
          name: "orderItem",
          text: "Small quesadilla",
          type: "button",
          value: "quesadilla-small",
        },
      ],
    },
  ],
};

export function getBurritoDialog(callbackId: string): Dialog {
  return {
    callbackId: callbackId,
    title: "Request a Ride",
    submitLabel: "Request",
    elements: [
      {
        label: "Filling",
        type: "select",
        name: "filling",
        options: [
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
            value: "mangolade",
          },
          {
            label: "Lemonade",
            value: "lemonade",
          },
        ],
      },
    ],
  };
}

export default async function dispatchCommand(
  command: OrderCommand | ShowBurritoDialogCommand,
) {
  switch (command.command) {
    case "order":
      return orderResponse;
    case "showBurritoDialog":
      return slackDialogOpener(command.triggerId, command.dialog);
  }
}
