/**
 * @file This types-only file refines generic TyRAS server-related types to Koa -specific types.
 */

import * as server from "@ty-ras/server";

import type * as fastify from "fastify";

/**
 * This is server context type for Fastify server.
 */
export interface ServerContext {
  /**
   * The {@link fastify.FastifyRequest} currently being handled as HTTP request.
   */
  req: fastify.FastifyRequest;

  /**
   * The {@link fastify.FastifyReply} currently being handled as HTTP response.
   */
  res: fastify.FastifyReply;
}

/**
 * This is generic, parametrizable, type for callbacks which create endpoint-specific state when processing requests in Fastify HTTP server.
 */
export type CreateState<TStateInfo> = server.StateProvider<
  ServerContext["req"],
  TStateInfo
>;
