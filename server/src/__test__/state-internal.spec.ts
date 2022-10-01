/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import test from "ava";

import * as spec from "../state-internal";
import * as common from "../state-common";

test("Validate modifyState works with invalid input", (t) => {
  t.plan(1);
  t.throws(() => spec.doGetStateFromRequest({} as any, undefined), {
    instanceOf: common.NoStatePresentWhenNeededError,
  });
});
