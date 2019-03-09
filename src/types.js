// @flow strict

declare export class KoaCtx {
  headers: {
    "x-slack-request-timestamp"?: string,
    "x-slack-signature"?: string,
  };
  request: {
    rawBody: string,
    body: {
      command?: string,
      text?: string,
      user_id?: string,
      trigger_id: string,
    },
  };
  status: number;
  body: {} | string;
}

declare export function KoaNext(): void;

export type Dialog = {
  callbackId: string,
  title: string,
  submitLabel: string,
  elements: Array<{
    label: string,
    type: "select",
    name: string,
    options: Array<{
      label: string,
      value: string,
    }>,
  }>,
};

export const Fillings = {
  beef: "beef",
  pork: "pork",
  chicken: "chicken",
  vegetables: "vegetables",
};

export type Filling = $Values<typeof Fillings>;

export const Drinks = {
  mangolade: "mangolade",
  lemonade: "lemonade",
};

export type Drink = $Values<typeof Drinks>;

export const Sauces = {
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
};

export type Sauce = $Values<typeof Sauces>;
