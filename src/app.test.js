import { f } from "./app";

it("should work!", () => {
  const number = 1;

  const result = f(number);

  expect(result).toEqual(2);
});
