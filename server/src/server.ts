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
import type * as tls from "node:tls";

/**
 * Creates new non-secure HTTP1 {@link http.Server} serving given TyRAS {@link ep.AppEndpoint}s with additional configuration via {@link ServerCreationOptions}.
 * @param opts The {@link ServerCreationOptions} to use when creating server.
 * @returns A new non-secure HTTP1 {@link http.Server}.
 */
export function createServer<TStateInfo, TState>(
  opts: ServerCreationOptions<
    TStateInfo,
    TState,
    fastify.FastifyHttpOptions<http.Server>,
    false
  > &
    HTTP1ServerOptions,
): http.Server;

/**
 * Creates new secure HTTP1 {@link https.Server} serving given TyRAS {@link ep.AppEndpoint}s with additional configuration via {@link ServerCreationOptions}.
 * @param opts The {@link ServerCreationOptions} to use when creating server.
 * @returns A new secure HTTP1 {@link https.Server}.
 */
export function createServer<TStateInfo, TState>(
  opts: ServerCreationOptions<
    TStateInfo,
    TState,
    fastify.FastifyHttpsOptions<https.Server>,
    true
  > &
    HTTP1ServerOptions,
): https.Server;

/**
 * Creates new non-secure HTTP2 {@link http2.Http2Server} serving given TyRAS {@link ep.AppEndpoint}s with additional configuration via {@link ServerCreationOptions}.
 * Please set `httpVersion` value of `opts` to `2` to use HTTP2 protocol.
 * @param opts The {@link ServerCreationOptions} to use when creating server.
 * @returns A new non-secure HTTP2 {@link http2.Http2Server}.
 */
export function createServer<TStateInfo, TState>(
  opts: ServerCreationOptions<
    TStateInfo,
    TState,
    Omit<fastify.FastifyHttp2Options<http2.Http2Server>, "http2">,
    false
  > &
    HTTP2ServerOptions,
): http2.Http2Server;

/**
 * Creates new secure HTTP2 {@link http2.Http2SecureServer} serving given TyRAS {@link ep.AppEndpoint}s with additional configuration via {@link ServerCreationOptions}.
 * Please set `httpVersion` value of `opts` to `2` to use HTTP2 protocol.
 * @param opts The {@link ServerCreationOptions} to use when creating server.
 * @returns A new secure HTTP2 {@link http2.Http2SecureServer}.
 */
export function createServer<TStateInfo, TState>(
  opts: ServerCreationOptions<
    TStateInfo,
    TState,
    Omit<fastify.FastifyHttp2SecureOptions<http2.Http2SecureServer>, "http2">,
    true
  > &
    HTTP2ServerOptions,
): http2.Http2SecureServer;

/**
 * Creates new secure or non-secure HTTP1 or HTTP2 Node server serving given TyRAS {@link ep.AppEndpoint}s with additional configuration via {@link ServerCreationOptions}.
 * Please set `httpVersion` value of `opts` to `2` to enable HTTP2 protocol, otherwise HTTP1 server will be returned.
 * @param opts The {@link ServerCreationOptions} to use when creating server.
 * @returns Secure or non-secure HTTP1 or HTTP2 Node server
 */
export function createServer<TStateInfo, TState>(
  opts:
    | (ServerCreationOptions<
        TStateInfo,
        TState,
        fastify.FastifyHttpOptions<http.Server>,
        false
      > &
        HTTP1ServerOptions)
    | (ServerCreationOptions<
        TStateInfo,
        TState,
        fastify.FastifyHttpsOptions<https.Server>,
        true
      > &
        HTTP1ServerOptions)
    | (ServerCreationOptions<
        TStateInfo,
        TState,
        Omit<fastify.FastifyHttp2Options<http2.Http2Server>, "http2">,
        false
      > &
        HTTP2ServerOptions)
    | (ServerCreationOptions<
        TStateInfo,
        TState,
        Omit<
          fastify.FastifyHttp2SecureOptions<http2.Http2SecureServer>,
          "http2"
        >,
        true
      > &
        HTTP2ServerOptions),
) {
  let retVal;
  if ("httpVersion" in opts && opts.httpVersion === 2) {
    fastify.default();
    const { options, secure, ...handlerOptions } = opts;
    // eslint-disable-next-line sonarjs/no-use-of-empty-return-value
    const httpHandler = createHandleHttpRequest2<TStateInfo, TState>(
      handlerOptions,
    );
    if (isSecure(secure, options, 2)) {
      retVal = http2.createSecureServer(options ?? {}, httpHandler);
    } else {
      retVal = http2.createServer(options ?? {}, httpHandler);
    }
  } else {
    const { options, secure, ...handlerOptions } = opts;
    const httpHandler = createHandleHttpRequest1<TStateInfo, TState>(
      handlerOptions,
    );
    if (isSecure(secure, options, 1)) {
      retVal = https.createServer(options ?? {}, httpHandler);
    } else {
      retVal = http.createServer(options ?? {}, httpHandler);
    }
  }
  return retVal;
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
  TStateInfo,
  TState,
  TOPtions,
  TSecure extends boolean,
> {
  /**
   * The TyRAS {@link ep.AppEndpoint}s to server via returned HTTP server.
   */
  endpoints: ReadonlyArray<ep.AppEndpoint<ctx.ServerContext, TStateInfo>>;

  /**
   * The callback to create endpoint-specific state objects.
   */
  createState?: ctx.CreateState<TStateInfo> | undefined;

  /**
   * The callback for tracking events occurred within the server.
   */
  events?:
    | server.ServerEventHandler<server.GetContext<ctx.ServerContext>, TState>
    | undefined;

  /**
   * The further options for the HTTP server.
   */
  options?: TOPtions | undefined;

  /**
   * Set this to `true` explicitly if automatic detection of server being secure by {@link createServer} fails.
   */
  secure?: TSecure | undefined;
}

const secureHttp1OptionKeys: ReadonlyArray<keyof tls.TlsOptions> = [
  "key",
  "cert",
  "pfx",
  "passphrase",
  "rejectUnauthorized",
  "ciphers",
  "ca",
  "requestCert",
  "secureContext",
  "secureOptions",
  "secureProtocol",
  "sigalgs",
  "ticketKeys",
  "crl",
  "clientCertEngine",
  "dhparam",
  "ecdhCurve",
  "allowHalfOpen",
  "handshakeTimeout",
  "honorCipherOrder",
  "keepAlive",
  "keepAliveInitialDelay",
  "maxVersion",
  "minVersion",
  "noDelay",
  "pauseOnConnect",
  "privateKeyEngine",
  "privateKeyIdentifier",
  "pskCallback",
  "pskIdentityHint",
  "sessionIdContext",
  "sessionTimeout",
  "ALPNProtocols",
  "SNICallback",
];

const secureHttp2OptionKeys: ReadonlyArray<
  "allowHTTP1" | "origins" | keyof tls.TlsOptions
> = ["allowHTTP1", "origins", ...secureHttp1OptionKeys];

const createHandleHttpRequest1 = <TStateInfo, TState>({
  endpoints,
  createState,
  events,
}: Pick<
  ServerCreationOptions<TStateInfo, TState, never, never>,
  "endpoints" | "createState" | "events"
>): HTTP1Or2Handler<http.IncomingMessage, http.ServerResponse> => {
  return express
    .default()
    .disable("x-powered-by")
    .use(middleware.createMiddleware(endpoints, createState, events));
};

// It looks like http2-express-bridge is not compatible with newer express versions.
// Furthermore, looks like http2 support is coming to express only in 5.x, which is still in beta.
// So for now,disable this.
const createHandleHttpRequest2 = <TStateInfo, TState>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: //   {
  //   endpoints,
  //   createState,
  //   events,
  // }:
  Pick<
    ServerCreationOptions<TStateInfo, TState, never, never>,
    "endpoints" | "createState" | "events"
  >,
): HTTP1Or2Handler<http2.Http2ServerRequest, http2.Http2ServerResponse> => {
  throw new Error(
    "Unfortunately, express v4.x does not support HTTP protocol version 2, and couldn't find any workaround for that (http2-express-bridge didn't work).",
  );
  // return http2Express(express.default)
  //   .disable("x-powered-by")
  //   .use(
  //     middleware.createMiddleware(endpoints, createState, events),
  //     // The http2-express-bridge typings are not so great, so we gotta do this explicit cast.
  //   ) as unknown as HTTP1Or2Handler<
  //   http2.Http2ServerRequest,
  //   http2.Http2ServerResponse
  // >;
};

type HTTP1Or2Handler<TRequest, TResponse> = (
  req: TRequest,
  res: TResponse,
) => void;

const isSecure = (
  secure: boolean | undefined,
  options: object | undefined,
  version: 1 | 2,
) =>
  secure ||
  (options &&
    (version === 1 ? secureHttp1OptionKeys : secureHttp2OptionKeys).some(
      (propKey) => propKey in options,
    ));
