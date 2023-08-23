/**
 * @file This file contains unit tests for functionality in file `../server.ts`.
 */

import test from "ava";

import * as spec from "../server";
import * as secure from "./secure";

import * as testSupport from "@ty-ras/server-test-support";
import type * as ctx from "../context.types";

const createServer: testSupport.CreateServer = (
  endpoints,
  info,
  httpVersion,
  secure,
) => {
  const instance =
    httpVersion === 1
      ? secure
        ? spec.createServer({
            endpoints,
            ...getCreateState(info),
            options: {
              https: secureInfo,
            },
          })
        : spec.createServer({ endpoints, ...getCreateState(info) })
      : httpVersion === 2
      ? secure
        ? spec.createServer({
            endpoints,
            ...getCreateState(info),
            httpVersion,
            options: {
              https: secureInfo,
            },
          })
        : spec.createServer({
            endpoints,
            ...getCreateState(info),
            httpVersion,
          })
      : doThrow(`Invalid http version: ${httpVersion}`);

  return {
    server: instance.server,
    secure,
    // instance.server instanceof https.Server ||
    // (!!options && "https" in options),
    customListen: async (host: string, port: number) => {
      await instance.listen({ host, port });
    },
  };
};

const secureInfo = secure.generateKeyAndCert();
const doThrow = (msg: string) => {
  throw new Error(msg);
};

const defaultOpts: testSupport.RegisterTestsOptions = {
  run500Test: true,
};

testSupport.registerTests(test, createServer, {
  ...defaultOpts,
  httpVersion: 1,
  secure: false,
});

testSupport.registerTests(test, createServer, {
  ...defaultOpts,
  httpVersion: 1,
  secure: true,
});

testSupport.registerTests(test, createServer, {
  ...defaultOpts,
  httpVersion: 2,
  secure: false,
});

testSupport.registerTests(test, createServer, {
  ...defaultOpts,
  httpVersion: 2,
  secure: true,
});

const getCreateState = (
  info: testSupport.ServerTestAdditionalInfo[0],
): Pick<
  spec.ServerCreationOptions<ctx.ServerContext, unknown, never, never>,
  "createState"
> =>
  info == 500
    ? {
        createState: () => {
          throw new Error("This should be catched.");
        },
      }
    : {};
