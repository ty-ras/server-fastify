import type * as ctx from "./context";
import * as common from "./state-common";

export const doGetStateFromContext = <T>(
  { req }: ctx.Context<T>,
  initialValue?: { value: T },
) => doGetStateFromRequest(req, initialValue);

export const doGetStateFromRequest = <T>(
  req: ctx.IncomingMessage,
  initialValue: { value: T } | undefined,
) => {
  let state: T;
  if ("__tyrasState" in req) {
    state = (req as ctx.FastifyRequestWithState<T>).__tyrasState;
  } else {
    if (!initialValue) {
      throw new common.NoStatePresentWhenNeededError(
        "State must be present in context",
      );
    }
    state = initialValue.value;
    (req as ctx.FastifyRequestWithState<T>).__tyrasState = state;
  }
  return state;
};
