/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type * as ctx from "../context-types";

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
