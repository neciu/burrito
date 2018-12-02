import { _checkEnvs } from "./checkEnvs";

it("should throw an error when there is any missing env", () => {
  delete process.env.required;

  expect(() => _checkEnvs(["required"])).toThrow(
    new Error("Missing ENVs: required"),
  );
});

it("should throw an error with full list of missing envs", () => {
  const e1 = "e1";
  const e2 = "e2";
  const e3 = "e3";
  const envs = [e1, e2, e3];
  envs.forEach(e => delete process.env[e]);

  envs.forEach(e => {
    expect(() => _checkEnvs([e2, e3, e1])).toThrowError(new RegExp(e));
  });
});

it("should subtract present envs from the error", () => {
  delete process.env.absent;
  process.env.present = "ohai";

  expect(() => _checkEnvs(["absent", "present"])).toThrowError(
    new Error("Missing ENVs: absent"),
  );
});

it("should not throw any error when all envs are there", () => {
  process.env.present = "ohai";

  expect(() => _checkEnvs(["present"])).not.toThrow();
});
