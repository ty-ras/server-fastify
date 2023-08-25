/**
 * @file This file contains function that can be used to expose uniform way to listen to TyRAS servers.
 */

import type * as server from "./server";
import type * as fastify from "fastify";

/**
 * The helper function to listen to given {@link server.HttpServer} asynchronously.
 * @param server The {@link server.HttpServer} to listen to.
 * @param host The hostname as string.
 * @param port The port as number.
 * @param backlog The backlog parameter, if any.
 * @returns Asynchronously nothing.
 */
export function listenAsync(
  server: server.HttpServer,
  host: string,
  port: number,
  backlog?: number,
): Promise<void>;

/**
 *The helper function to listen to given {@link server.HttpServer} asynchronously.
 * @param server The {@link server.HttpServer} to listen to.
 * @param options The {@link ListenOptions1} or {@link ListenOptions2}.
 * @returns Asynchronously nothing.
 */
export function listenAsync(
  server: server.HttpServer,
  options: fastify.FastifyListenOptions,
): Promise<void>;

/**
 * The helper function to listen to given {@link server.HttpServer} asynchronously.
 * @param server The {@link server.HttpServer} to listen to.
 * @param hostOrOptions The {@link ListenOptions1} or {@link ListenOptions2}.
 * @param port The port to listen to.
 * @param backlog The backlog parameter, if any.
 * @returns Asynchronously nothing.
 */
export async function listenAsync(
  server: server.HttpServer,
  hostOrOptions: string | fastify.FastifyListenOptions,
  port?: number,
  backlog?: number,
) {
  // Notice that we _must_ use Fastify instance's own listen method!
  // Otherwise the Fastify will not have its own internal things available when the server will receive request.
  const opts: fastify.FastifyListenOptions =
    typeof hostOrOptions === "string"
      ? Object.assign(
          {
            host: hostOrOptions,
          },
          port === undefined ? {} : { port },
          backlog === undefined ? {} : { backlog },
        )
      : hostOrOptions;

  await server.listen(opts);
}
