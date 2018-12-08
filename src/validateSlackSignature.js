// @flow strict

import crypto from "crypto";

export default function validateSignature(parameters: {
  timestamp?: string,
  body?: string,
  secret?: string,
  signature?: string,
}): void {
  if (
    parameters.timestamp &&
    parameters.body &&
    parameters.secret &&
    parameters.signature
  ) {
    const { timestamp, body, secret, signature } = parameters;
    const calculatedSignature = getSignature(timestamp, body, secret);

    if (calculatedSignature !== signature) {
      throw new Error("Invalid signature calculated");
    }
  } else {
    const requiredParameters = ["timestamp", "body", "secret", "signature"];
    const missingParameters = requiredParameters.filter(
      key => !parameters[key] || parameters[key] === undefined,
    );
    if (missingParameters.length > 0) {
      throw new Error(`Missing parameters: ${missingParameters.join(", ")}`);
    }
  }
}

export function getSignature(
  timestamp: string,
  body: string,
  secret: string,
): string {
  const base = `v0:${timestamp}:${body}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(base, "utf8")
    .digest("hex");
  return `v0=${signature}`;
}
