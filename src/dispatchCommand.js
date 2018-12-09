// @flow strict

declare type OrderCommand = {
  author: string,
  command: "order",
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

export default async function dispatchCommand(command: OrderCommand) {
  switch (command.command) {
    case "order":
      return orderResponse;
  }
}
