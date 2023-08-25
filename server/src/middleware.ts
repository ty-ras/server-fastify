/**
 * @file This file contains helper function to create Fastify middleware callback.
 */

import * as ep from "@ty-ras/endpoint";
import * as protocol from "@ty-ras/protocol";
import * as server from "@ty-ras/server";
import type * as fastify from "fastify";
import type * as context from "./context.types";
import * as internal from "./internal";

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */

/**
 * Creates a new {@link FastifyRouteHandler} to serve the given TyRAS {@link ep.AppEndpoint}s.
 * @param endpoints The TyRAS {@link ep.AppEndpoint}s to serve through this Koa middleware.
 * @param createState The optional callback to create state for the endpoints.
 * @param events The optional {@link server.ServerEventHandler} callback to observe server events.
 * @returns The Koa middleware which will serve the given endpoints.
 */
export const createMiddleware = <
  TServerContext extends context.ServerContext,
  TStateInfo,
  TState,
>(
  endpoints: ReadonlyArray<ep.AppEndpoint<TServerContext, TStateInfo>>,
  createState?: context.CreateState<TStateInfo>,
  events?: server.ServerEventHandler<server.GetContext<TServerContext>, TState>,
): FastifyRouteHandler<TServerContext> => {
  const flow = server.createTypicalServerFlow(
    endpoints,
    {
      ...internal.staticCallbacks,
      getState: ({ req }, stateInfo) =>
        createState?.({ context: req as any, stateInfo }),
    },
    events,
  );
  return async (req, res) => await flow({ req, res } as any);
};

/**
 * This is helper method to register callback created by {@link createMiddleware} to given {@link fastify.FastifyInstance} so that the the TyRAS functionality will work correctly.
 * @param instance The Fastify server {@link fastify.FastifyInstance}.
 * @param middleware The callback created by {@link createMiddleware}.
 * @param options The options for {@link fastify.FastifyInstance.route} call.
 */
export const registerRouteToFastifyInstance = <
  TServerContext extends context.ServerContext,
>(
  instance: fastify.FastifyInstance<GetFastifyServerType<TServerContext>>,
  middleware: FastifyRouteHandler<TServerContext>,
  options?: Omit<
    fastify.RouteOptions<GetFastifyServerType<TServerContext>>,
    "method" | "url" | "handler"
  >,
) => {
  // We must pass body completely raw to our route, since only in the route we will know the actual body validation.
  // To achieve that, we remove the default content type parsers, and register universal parser, which simply passes the body as-is onwards to the route.
  instance.removeAllContentTypeParsers();
  instance.addContentTypeParser(/.*/, {}, (_, rawBody, done) => {
    done(null, rawBody);
  });
  // Handler:
  //  FastifyRequest<RouteGeneric, RawServer, RawRequest, SchemaCompiler, TypeProvider, ContextConfig, Logger>,
  // Prehook:
  // FastifyRequest<RouteGeneric, RawServer, RawRequest, SchemaCompiler, TypeProvider, ContextConfig, Logger>,
  instance.route({
    ...(options ?? {}),
    // Capture all methods
    method: [
      protocol.METHOD_GET,
      protocol.METHOD_POST,
      protocol.METHOD_PUT,
      protocol.METHOD_PATCH,
      protocol.METHOD_OPTIONS,
      protocol.METHOD_HEAD,
      protocol.METHOD_DELETE,
      // Should we also capture TRACE?
    ],
    // Capture all URLs
    url: "*",
    // Handle them with the handler
    handler: middleware,
  });
};

/**
 * This is TyRAS-specific Fastify route handler type, forcing the return type to asynchronous `void`.
 */
export type FastifyRouteHandler<TServerContext extends context.ServerContext> =
  (
    this: void,
    request: fastify.FastifyRequest<
      fastify.RouteGenericInterface,
      GetFastifyServerType<TServerContext>
    >,
    reply: fastify.FastifyReply<GetFastifyServerType<TServerContext>>,
  ) => Promise<void>;

/**
 * This is helper type to convert TyRAS {@link context.ServerContext} into fastify `RawServer` generic type argument.
 */
export type GetFastifyServerType<TServerContext extends context.ServerContext> =
  TServerContext extends context.ServerContextGeneric<infer TServer>
    ? TServer
    : never;
