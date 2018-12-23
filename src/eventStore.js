// @flow strict

import uuidv4 from "uuid/v4";
import googleApi from "./googleApi";
import type { AddOrderItemCommand } from "commands";
import { CommandType } from "commands";

export async function appendEvent(
  command: AddOrderItemCommand,
  appendRow: (rowData: Array<string | number>) => Promise<any> = _appendRow,
) {
  switch (command.type) {
    case CommandType.add_order_item: {
      return await appendRow([
        uuidv4(),
        new Date(Date.now()).toISOString(),
        command.type,
        1,
        command.userName,
        command.item.type,
        command.item.filling,
        command.item.sauce,
        command.item.drink || "",
        command.item.comments,
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
