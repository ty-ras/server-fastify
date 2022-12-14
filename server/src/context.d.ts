import * as server from "@ty-ras/server";

import type * as http from "http";
import type * as http2 from "http2";

export interface HKTContext extends server.HKTContext {
  readonly type: Context<this["_TState"]>;
}

export type Context<T> = {
  req: FastifyRequestWithState<T>;
  res: http.ServerResponse;
};

export type FastifyRequestWithState<T> = IncomingMessage & {
  __tyrasState: T;
};

export type IncomingMessage = http.IncomingMessage | http2.Http2ServerRequest;
