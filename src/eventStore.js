// @flow strict

import uuidv4 from "uuid/v4";
import type { AddOrderItemCommand } from "./dispatchCommand";
import googleApi from "./googleApi";

export async function appendEvent(
  command: AddOrderItemCommand,
  appendRow: (rowData: Array<string | number>) => Promise<any> = _appendRow,
) {
  switch (command.command) {
    case "addOrderItem": {
      return await appendRow([
        uuidv4(),
        new Date(Date.now()).toISOString(),
        command.command,
        1,
        command.userName,
        command.orderItem.type,
        command.orderItem.filling,
        command.orderItem.sauce,
        command.orderItem.drink,
      ]);
    }
  }
}

async function _appendRow(rowData: Array<string | number>) {
  const request = {
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Class Data!A:A",
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [rowData],
    },
  };

  await googleApi.sheetsAppend(request);
}
