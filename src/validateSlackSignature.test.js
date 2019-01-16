import validateSignature, { getSignature } from "validateSlackSignature";

const validParameters = {
  timestamp: "1544283133",
  body: "token=XXXXYYYY&team_id=AAABB&team_domain=ZZZYYY",
  secret: "xxxxyyyyxxxxyyyyxxxxyyyyxxxxyyyy",
  signature:
    "v0=878913770832d1cc4f54690b8f552705690c4c42f783241602a4f2e9ef6898b3",
};

describe("validateSignature", () => {
  it.each`
    missingParameters          | expectedError
    ${["timestamp"]}           | ${"Missing parameters: timestamp"}
    ${["body"]}                | ${"Missing parameters: body"}
    ${["secret"]}              | ${"Missing parameters: secret"}
    ${["signature"]}           | ${"Missing parameters: signature"}
    ${["timestamp", "secret"]} | ${"Missing parameters: timestamp, secret"}
  `(
    "should throw $expectedError when $missingParameters are missing",
    ({ missingParameters, expectedError }) => {
      const parameters = missingParameters.reduce(
        (params, missingParameter) => ({
          ...params,
          [missingParameter]: undefined,
        }),
        { ...validParameters },
      );

      expect(() => validateSignature(parameters)).toThrow(
        new Error(expectedError),
      );
    },
  );

  it("should not throw when all parameters are correct", () => {
    expect(() => validateSignature(validParameters)).not.toThrow();
  });

  it("should throw when signature is different", () => {
    const params = {
      ...validParameters,
      signature: "NOPE!",
    };
    expect(() => validateSignature(params)).toThrow(
      new Error("Invalid signature calculated"),
    );
  });
});

describe("getSignature", () => {
  it("should return same signature as in validParameters", () => {
    const result = getSignature(
      validParameters.timestamp,
      validParameters.body,
      validParameters.secret,
    );

    expect(result).toEqual(validParameters.signature);
  });
});
