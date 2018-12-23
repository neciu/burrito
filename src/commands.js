// @flow strict

import OrderItemType from "OrderItemType";

export const CommandType = {
  show_order_item_buttons: "show_order_item_buttons",
  show_order_item_dialog: "show_order_item_dialog",
  add_order_item: "add_order_item",
};

export type ShowOrderItemButtonsCommand = {|
  type: typeof CommandType.show_order_item_buttons,
|};

export type ShowOrderItemDialogCommand = {|
  type: typeof CommandType.show_order_item_dialog,
  itemType: $Keys<typeof OrderItemType>,
  triggerId: string,
|};

export type AddOrderItemCommand = {|
  type: typeof CommandType.add_order_item,
  responseUrl: string,
  userName: string,
  item: {
    type: $Keys<typeof OrderItemType>,
    filling: string,
    sauce: string,
    drink?: string,
    comments: string,
  },
|};
