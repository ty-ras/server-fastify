/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import test from "ava";

import * as spec from "../state";
import * as ctx from "./context";

test("Validate getStateFromContext works", (t) => {
  t.plan(1);
  t.deepEqual(
    spec.getStateFromContext(ctx.dummyContext),
    ctx.dummyContext.req.__tyrasState,
  );
});

test("Validate modifyState works", (t) => {
  t.plan(1);
  const ctxCopy: typeof ctx.dummyContext = {
    ...ctx.dummyContext,
    req: {
      ...ctx.dummyContext.req,
      __tyrasState: {
        ...ctx.dummyContext.req.__tyrasState,
      },
    } as any,
  };
  spec.modifyState(
    ctxCopy.req,
    ctxCopy.req.__tyrasState,
    (state) => (state.property = "Modified"),
  );
  t.deepEqual(ctxCopy.req, { __tyrasState: { property: "Modified" } });
});
