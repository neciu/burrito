// @flow strict

declare export class KoaCtx {
  headers: {
    "x-slack-request-timestamp"?: string,
    "x-slack-signature"?: string,
  };
  request: {
    rawBody: string,
  };
  status: number;
}

declare export function KoaNext(): void;
