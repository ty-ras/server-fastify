import type * as ava from "ava";
import getPort from "@ava/get-port";

import * as destroy from "./destroy";
import * as request from "./request";

import type * as ep from "@ty-ras/endpoint";

import * as http from "http";
import type * as net from "net";

export const testServer = async (
  t: ava.ExecutionContext,
  createServer: (endpoint: Array<ep.AppEndpoint<unknown, never>>) =>
    | http.Server
    | {
        server: http.Server;
        customListen: (host: string, port: number) => Promise<void>;
      },
  info:
    | undefined
    | {
        regExp: RegExp;
        expectedStatusCode: number;
      }
    | 204
    | 403
    | string, // suffix for value of content-type of response
) => {
  const isError = typeof info === "object";
  const isProtocolError = info === 403;
  const state = "State";
  const responseData = info === 204 ? undefined : state;
  t.plan(isError || isProtocolError ? 2 : 1);
  const serverObj = createServer([
    getAppEndpoint(
      isError ? info?.regExp : /^\/(?<group>path)$/,
      isProtocolError ? info : undefined,
      state,
      responseData,
    ),
  ]);
  const server =
    serverObj instanceof http.Server ? serverObj : serverObj.server;
  // AVA runs tests in parallel -> use plugin to get whatever available port
  const host = "127.0.0.1";
  const port = await getPort();
  const destroyServer = destroy.createDestroyCallback(server);
  try {
    // Start the server
    await (serverObj instanceof http.Server
      ? listenAsync(server, host, port)
      : serverObj.customListen(host, port));

    const requestOpts: http.RequestOptions = {
      hostname: host,
      port,
      method: "GET",
      path: "/path",
    };

    if (isError || info === 403) {
      await performFailingTest(
        t,
        requestOpts,
        isError ? info.expectedStatusCode : info,
      );
    } else {
      await performSuccessfulTest(
        t,
        requestOpts,
        responseData,
        typeof info === "string" ? info : "",
      );
    }
  } finally {
    try {
      // Shut down the server
      await destroyServer();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to destroy server, the test might become stuck...");
    }
  }
};

const getAppEndpoint = (
  regExp: RegExp,
  protocolError: number | undefined,
  state: string,
  output: string | undefined,
): ep.AppEndpoint<unknown, never> => ({
  getRegExpAndHandler: () => ({
    url: regExp,
    handler: () => ({
      found: "handler",
      handler: {
        contextValidator: {
          validator: (ctx) =>
            protocolError === undefined
              ? {
                  error: "none",
                  data: ctx,
                }
              : {
                  error: "protocol-error",
                  statusCode: 403,
                  body: undefined,
                },
          getState: () => state,
        },
        handler: () => ({
          error: "none",
          data: {
            contentType: JSON_CONTENT_TYPE,
            output,
            headers: {
              "response-header-name": "response-header-value",
            },
          },
        }),
      },
    }),
  }),
  getMetadata: () => {
    throw new Error("This should never be called.");
  },
});

const listenAsync = (server: net.Server, host: string, port: number) =>
  new Promise<void>((resolve, reject) => {
    try {
      server.listen(port, host, () => resolve());
    } catch (e) {
      reject(e);
    }
  });

const performSuccessfulTest = async (
  t: ava.ExecutionContext,
  requestOpts: http.RequestOptions,
  responseData: string | undefined,
  contentTypeSuffix: string,
) => {
  if (responseData !== undefined) {
    requestOpts.method = "POST";
    requestOpts.headers = {
      "Content-Type": JSON_CONTENT_TYPE,
    };
  }
  // Send the request
  const response = await request.requestAsync(requestOpts, (writeable) => {
    writeable.write(JSON.stringify("input"));
    return Promise.resolve();
  });
  // Let's not test this one as it varies every time
  delete response.headers["date"];
  const expectedHeaders: Record<string, string> = {
    connection: "close",
    "response-header-name": "response-header-value",
  };
  if (responseData !== undefined) {
    expectedHeaders["content-length"] = "5";
    expectedHeaders[
      "content-type"
    ] = `${JSON_CONTENT_TYPE}${contentTypeSuffix}`;
  }
  t.deepEqual(response, {
    data: responseData,
    headers: expectedHeaders,
  });
};

const performFailingTest = async (
  t: ava.ExecutionContext,
  requestOpts: http.RequestOptions,
  expectedStatusCode: number,
) => {
  const thrownError = await t.throwsAsync<request.RequestError>(
    async () => await request.requestAsync(requestOpts),
    {
      instanceOf: request.RequestError,
      message: request.getErrorMessage(expectedStatusCode),
    },
  );
  if (thrownError) {
    t.deepEqual(thrownError.statusCode, expectedStatusCode);
  }
};

const JSON_CONTENT_TYPE = "application/json";
