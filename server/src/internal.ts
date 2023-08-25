/**
 * @file This file contains internal code for e.g. implementing Express HTTP server -specific functionality of {@link server.ServerFlowCallbacksWithoutState}.
 */

import type * as server from "@ty-ras/server";
import type * as ctx from "./context.types";

import * as stream from "node:stream";
import type * as http from "node:http";
import type * as https from "node:https";
import type * as http2 from "node:http2";

/**
 * This object implements the {@link server.ServerFlowCallbacksWithoutState} functionality for Express servers.
 */
export const staticCallbacks: server.ServerFlowCallbacksWithoutState<ctx.ServerContext> =
  {
    getURL: ({ req }) => req.url,
    getMethod: ({ req }) => req.method,
    getHeader: ({ req }, headerName) => req.headers[headerName],
    getRequestBody: ({ req }) =>
      req.body instanceof stream.Readable ? req.body : undefined,
    setHeader: (ctx, headerName, headerValue) => {
      // If we don't assign to res, we will become stuck
      ctx.res = ctx.res.header(headerName, headerValue);
    },
    setStatusCode: (ctx, statusCode) => {
      // If we don't assign to res, we will become stuck
      ctx.res = ctx.res.code(statusCode);
    },
    sendContent: async ({ res }, content) =>
      await res.send(
        typeof content === "string" ? Buffer.from(content) : content,
      ),
  };

/**
 * This is internal helper type to represent server context which can have HTTP1 or HTTP2 requests and responses.
 */
export type ServerContextGenericHTTP1Or2 = ctx.ServerContextGeneric<
  http.Server | https.Server | http2.Http2Server | http2.Http2SecureServer
>;
