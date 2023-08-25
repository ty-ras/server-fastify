/**
 * @file This file exposes function to create Node HTTP 1 or 2 server serving giving TyRAS {@link ep.AppEndpoint}s.
 */

import * as ep from "@ty-ras/endpoint";
import * as server from "@ty-ras/server";
import * as fastify from "fastify";
import type * as ctx from "./context.types";
import * as middleware from "./middleware";

import * as http from "node:http";
import * as https from "node:https";
import * as http2 from "node:http2";

/**
 * Creates new non-secure HTTP1 {@link fastify.FastifyInstance} serving given TyRAS {@link ep.AppEndpoint}s with additional configuration via {@link ServerCreationOptions}.
 * @param opts The {@link ServerCreationOptions} to use when creating server.
 * @returns A new non-secure HTTP1 {@link fastify.FastifyInstance}.
 */
export function createServer<TStateInfo, TState>(
  opts: ServerCreationOptions<
    ctx.HTTP1ServerContext,
    TStateInfo,
    TState,
    fastify.FastifyHttpOptions<http.Server>
  > &
    HTTP1ServerOptions,
): fastify.FastifyInstance<http.Server>;

/**
 * Creates new secure HTTP1 {@link fastify.FastifyInstance} serving given TyRAS {@link ep.AppEndpoint}s with additional configuration via {@link ServerCreationOptions}.
 * @param opts The {@link ServerCreationOptions} to use when creating server.
 * @returns A new secure HTTP1 {@link fastify.FastifyInstance}.
 */
export function createServer<TStateInfo, TState>(
  opts: ServerCreationOptions<
    ctx.HTTP1ServerContext,
    TStateInfo,
    TState,
    fastify.FastifyHttpsOptions<https.Server>
  > &
    HTTP1ServerOptions,
): fastify.FastifyInstance<https.Server>;

/**
 * Creates new non-secure HTTP2 {@link fastify.FastifyInstance} serving given TyRAS {@link ep.AppEndpoint}s with additional configuration via {@link ServerCreationOptions}.
 * Please set `httpVersion` value of `opts` to `2` to use HTTP2 protocol.
 * @param opts The {@link ServerCreationOptions} to use when creating server.
 * @returns A new non-secure HTTP2 {@link fastify.FastifyInstance}.
 */
export function createServer<TStateInfo, TState>(
  opts: ServerCreationOptions<
    ctx.HTTP2ServerContext,
    TStateInfo,
    TState,
    Omit<fastify.FastifyHttp2Options<http2.Http2Server>, "http2">
  > &
    HTTP2ServerOptions,
): fastify.FastifyInstance<http2.Http2Server>;

/**
 * Creates new secure HTTP2 {@link fastify.FastifyInstance} serving given TyRAS {@link ep.AppEndpoint}s with additional configuration via {@link ServerCreationOptions}.
 * Please set `httpVersion` value of `opts` to `2` to use HTTP2 protocol.
 * @param opts The {@link ServerCreationOptions} to use when creating server.
 * @returns A new secure HTTP2 {@link fastify.FastifyInstance}.
 */
export function createServer<TStateInfo, TState>(
  opts: ServerCreationOptions<
    ctx.HTTP2ServerContext,
    TStateInfo,
    TState,
    Omit<fastify.FastifyHttp2SecureOptions<http2.Http2SecureServer>, "http2">
  > &
    HTTP2ServerOptions,
): fastify.FastifyInstance<http2.Http2SecureServer>;

/**
 * Creates new secure or non-secure HTTP1 or HTTP2 Node server serving given TyRAS {@link ep.AppEndpoint}s with additional configuration via {@link ServerCreationOptions}.
 * Please set `httpVersion` value of `opts` to `2` to enable HTTP2 protocol, otherwise HTTP1 server will be returned.
 * @param opts The {@link ServerCreationOptions} to use when creating server.
 * @param opts.options Privately deconstructed variable.
 * @param opts.endpoints Privately deconstructed variable.
 * @param opts.createState Privately deconstructed variable.
 * @param opts.events Privately deconstructed variable.
 * @param opts.httpVersion Privately deconstructed variable.
 * @returns Secure or non-secure HTTP1 or HTTP2 Node server
 */
export function createServer<TStateInfo, TState>({
  options,
  endpoints,
  createState,
  events,
  httpVersion,
}:
  | (ServerCreationOptions<
      ctx.HTTP1ServerContext,
      TStateInfo,
      TState,
      fastify.FastifyHttpOptions<http.Server>
    > &
      HTTP1ServerOptions)
  | (ServerCreationOptions<
      ctx.HTTP1ServerContext,
      TStateInfo,
      TState,
      fastify.FastifyHttpsOptions<https.Server>
    > &
      HTTP1ServerOptions)
  | (ServerCreationOptions<
      ctx.HTTP2ServerContext,
      TStateInfo,
      TState,
      Omit<fastify.FastifyHttp2Options<http2.Http2Server>, "http2">
    > &
      HTTP2ServerOptions)
  | (ServerCreationOptions<
      ctx.HTTP2ServerContext,
      TStateInfo,
      TState,
      Omit<fastify.FastifyHttp2SecureOptions<http2.Http2SecureServer>, "http2">
    > &
      HTTP2ServerOptions)): HttpServer {
  const instance =
    options === undefined
      ? fastify.default()
      : httpVersion === 2
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        fastify.default({ http2: true, ...options } as any)
      : // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        fastify.default(options as any);
  middleware.registerRouteToFastifyInstance(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    instance as any,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    middleware.createMiddleware(endpoints as any, createState, events),
  );
  return instance;
}

/**
 * This type is used to make it possible to explicitly specify using HTTP protocol version 1 for server if given to {@link createServer}.
 */
export type HTTP1ServerOptions = {
  /**
   * Optional property which should be set to `1` if needed to explicitly use HTTP protocol version 1 for server.
   * The default protocol version is 1, so this is optional.
   */
  httpVersion?: 1;
};

/**
 * This type is used to make it possible to specify {@link createServer} to use HTTP protocol version 2, as opposed to default 1.
 */
export type HTTP2ServerOptions = {
  /**
   * Property which should be set to `2` if needed to use HTTP protocol version 2 for server.
   * The default protocol version is 1, so to override that, this property must be specified.
   */
  httpVersion: 2;
};

/**
 * This interface contains options common for both HTTP 1 and 2 servers when creating them via {@link createServer}.
 */
export interface ServerCreationOptions<
  TServerContext extends { req: unknown },
  TStateInfo,
  TState,
  TOPtions,
> {
  /**
   * The TyRAS {@link ep.AppEndpoint}s to server via returned HTTP server.
   */
  endpoints: ReadonlyArray<ep.AppEndpoint<TServerContext, TStateInfo>>;

  /**
   * The callback to create endpoint-specific state objects.
   */
  createState?: ctx.CreateStateGeneric<TStateInfo, TServerContext> | undefined;

  /**
   * The callback for tracking events occurred within the server.
   */
  events?:
    | server.ServerEventHandler<server.GetContext<TServerContext>, TState>
    | undefined;

  /**
   * The further options for the HTTP server.
   */
  options?: TOPtions | undefined;
}
/**
 * This type contains all the HTTP server types that can be created with TyRAS backend for Fastify servers.
 */
export type HttpServer =
  | fastify.FastifyInstance<http.Server>
  | fastify.FastifyInstance<https.Server>
  | fastify.FastifyInstance<http2.Http2Server>
  | fastify.FastifyInstance<http2.Http2SecureServer>;
