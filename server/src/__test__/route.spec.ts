import test, { ExecutionContext } from "ava";

import * as spec from "../route";
import * as server from "./server";

import * as fastify from "fastify";

test("Validate Koa middleware works for happy path", async (t) => {
  await testFastifyServer(t, "; charset=utf-8");
});

test("Validate Koa middleware works for 404", async (t) => {
  await testFastifyServer(t, {
    regExp: /ungrouped-regexp-will-never-match/,
    expectedStatusCode: 404,
  });
});

test("Validate Koa middleware works for 204", async (t) => {
  await testFastifyServer(t, 204);
});
test("Validate Koa middleware works for 403", async (t) => {
  await testFastifyServer(t, 403);
});

const testFastifyServer = (
  t: ExecutionContext,
  info: Parameters<typeof server.testServer>[2],
) =>
  server.testServer(
    t,
    (endpoints) => {
      const server = fastify
        .default
        //{ logger: { level: "info" } }
        ();
      spec.registerRouteToFastifyInstance(
        server,
        spec.createRoute(endpoints, {}),
        {},
      );
      return {
        server: server.server,
        // Using listen on returned "server" object causes internal Fastify errors
        // So pass on custom listen callback.
        customListen: async (host, port) => {
          await server.listen({ host, port });
        },
      };
    },
    info,
  );
