/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import test from "ava";
import * as spec from "../context";
import * as ctx from "./context";
import type * as data from "@ty-ras/data";

// These look a bit silly but they make more sense in other server frameworks.
// The functions are provided here for orthogonality's sake.

test("Validate validateContextState works", (t) => {
  t.plan(2);
  const { validator, getState } = spec.validateContextState((data) => ({
    error: "none",
    data,
  }));
  t.deepEqual(validator(ctx.dummyContext), {
    error: "none",
    data: ctx.dummyContext,
  });
  t.deepEqual(getState(ctx.dummyContext), ctx.dummyContext.req.__tyrasState);
});

test("Validate validateContextState works with failing callback", (t) => {
  t.plan(2);
  const { validator, getState } = spec.validateContextState(erroringValidator);
  t.deepEqual(validator(ctx.dummyContext), errorObject);
  t.deepEqual(getState(ctx.dummyContext), ctx.dummyContext.req.__tyrasState);
});

test("Validate validateContextState works with failing callback and custom status code", (t) => {
  t.plan(2);
  const { validator, getState } = spec.validateContextState(
    erroringValidator,
    403,
  );
  t.deepEqual(validator(ctx.dummyContext), {
    error: "protocol-error",
    statusCode: 403,
    body: undefined,
  });
  t.deepEqual(getState(ctx.dummyContext), ctx.dummyContext.req.__tyrasState);
});

test("Validate validateContextState works with failing callback and custom status code and body", (t) => {
  t.plan(2);
  const { validator, getState } = spec.validateContextState(erroringValidator, {
    statusCode: 403,
    body: "Body",
  });
  t.deepEqual(validator(ctx.dummyContext), {
    error: "protocol-error",
    statusCode: 403,
    body: "Body",
  });
  t.deepEqual(getState(ctx.dummyContext), ctx.dummyContext.req.__tyrasState);
});

const getHumanReadableMessage = () => "";

const erroringValidator: data.DataValidator<unknown, unknown> = () =>
  errorObject;

const errorObject: data.DataValidatorResultError = {
  error: "error",
  errorInfo: "Info",
  getHumanReadableMessage,
};
