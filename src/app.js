// @flow strict

import checkEnvs from "./checkEnvs";

checkEnvs();

export function f(a: number): number {
  return a * 2;
}

f(2);
