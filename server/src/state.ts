import type * as ctxTypes from "./context-types";
import type * as ctx from "./context";

import type * as server from "@ty-ras/server";
import * as state from "./state-internal";

export const getStateFromContext: server.GetStateFromContext<ctx.HKTContext> = (
  ctx,
) => state.doGetStateFromContext(ctx);

// This is meant to be used by middleware occurring before the actual REST API.
export const modifyState = <TState>(
  req: ctxTypes.IncomingMessage,
  initialValue: TState,
  modify: (state: TState) => void,
) => {
  modify(state.doGetStateFromRequest(req, { value: initialValue }));
};
