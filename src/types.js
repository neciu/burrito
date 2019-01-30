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
    },
  };
  status: number;
  body: {};
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

export type Filling = $Keys<typeof Fillings>;

export const Drinks = {
  mangolade: "mangolade",
  lemonade: "lemonade",
};

export type Drink = $Keys<typeof Drinks>;
