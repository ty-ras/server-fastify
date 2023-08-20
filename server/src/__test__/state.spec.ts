/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import test from "ava";

import * as spec from "../state";
import type * as ctx from "../context.types";

test("Validate getStateFromContext works", (t) => {
  t.plan(1);
  t.deepEqual(
    spec.getStateFromContext(dummyContext),
    dummyContext.req.__tyrasState,
  );
});

test("Validate modifyState works", (t) => {
  t.plan(1);
  const ctxCopy: typeof dummyContext = {
    ...dummyContext,
    req: {
      ...dummyContext.req,
      __tyrasState: {
        ...dummyContext.req.__tyrasState,
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

export const dummyContext: ctx.Context<State> = {
  req: {
    __tyrasState: {
      property: "Property",
    },
  },
} as any;

export interface State {
  property: string;
}
