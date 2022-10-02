import * as ep from "@ty-ras/endpoint";
import * as prefix from "@ty-ras/endpoint-prefix";
import * as server from "@ty-ras/server";
import type * as fastify from "fastify";
import type * as ctx from "./context";
import * as state from "./state-internal";
import * as stream from "stream";

// Using given various endpoints, create object which is able to handle the requests as Fastify route.
export const createRoute = <TState>(
  endpoints: ReadonlyArray<
    ep.AppEndpoint<ctx.Context<TState>, Record<string, unknown>>
  >,
  initialState: TState,
  events:
    | server.ServerEventEmitter<ctx.Context<TState>, TState>
    | undefined = undefined,
): FastifyRouteHandler => {
  // Combine given endpoints into top-level entrypoint
  const regExpAndHandler = prefix
    .atPrefix("", ...endpoints)
    .getRegExpAndHandler("");
  // Return callback
  return async (req, res) => {
    await server.typicalServerFlow(
      {
        req: req.raw as ctx.FastifyRequestWithState<TState>,
        res: res.raw,
      },
      regExpAndHandler,
      events,
      {
        getURL: () => req.raw.url,
        getState: (ctx) =>
          state.doGetStateFromContext(ctx, { value: initialState }),
        getMethod: () => req.method,
        getHeader: (_, headerName) => req.headers[headerName],
        getRequestBody: () =>
          req.body instanceof stream.Readable ? req.body : undefined,
        setHeader: (_, headerName, headerValue) => {
          // If we don't assign to res, we will become stuck
          res = res.header(headerName, headerValue);
        },
        setStatusCode: (_, statusCode) => {
          // If we don't assign to res, we will become stuck
          res = res.code(statusCode);
        },
        sendContent: async (_, content) =>
          await res.send(
            typeof content === "string" ? Buffer.from(content) : content,
          ),
      },
    );
  };
};

export const registerRouteToFastifyInstance = (
  instance: fastify.FastifyInstance,
  middleware: FastifyRouteHandler,
  options: Omit<fastify.RouteOptions, "method" | "url" | "handler">,
) => {
  // We must pass body completely raw to our route, since only in the route we will know the actual body validation.
  // To achieve that, we remove the default content type parsers, and register universal parser, which simply passes the body as-is onwards to the route.
  instance.removeAllContentTypeParsers();
  instance.addContentTypeParser(/.*/, {}, (_, rawBody, done) => {
    done(null, rawBody);
  });
  instance.route({
    ...options,
    // Capture all methods
    method: ["GET", "POST", "PUT", "PATCH", "OPTIONS", "HEAD", "DELETE"],
    // Capture all URLs
    url: "*",
    // Handle them with the handler
    handler: middleware,
  });
};

export type FastifyRouteHandler = (
  ...params: Parameters<fastify.preHandlerAsyncHookHandler>
) => Promise<void>;
