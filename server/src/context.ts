import * as server from "@ty-ras/server";
import type * as ctx from "./context-types";
import * as state from "./state-internal";

export interface HKTContext extends server.HKTContext {
  readonly type: ctx.Context<this["_TState"]>;
}

export const validateContextState: server.ContextValidatorFactory<
  HKTContext
> = (validator, protocolErrorInfo) => ({
  validator: (ctx) => {
    const transformed = validator(state.doGetStateFromContext(ctx));
    if (transformed.error === "none") {
      return {
        error: "none" as const,
        data: ctx as unknown as ctx.Context<
          server.DataValidatorOutput<typeof validator>
        >,
      };
    } else {
      return protocolErrorInfo === undefined
        ? transformed
        : {
            error: "protocol-error",
            statusCode:
              typeof protocolErrorInfo === "number"
                ? protocolErrorInfo
                : protocolErrorInfo.statusCode,
            body:
              typeof protocolErrorInfo === "number"
                ? undefined
                : protocolErrorInfo.body,
          };
    }
  },
  getState: state.doGetStateFromContext,
});
