import test from "ava";

import * as spec from "../middleware";

import * as fastify from "fastify";
import * as testSupport from "@ty-ras/server-test-support";

testSupport.registerTests(test, (endpoints) => {
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
    secure: false,
  };
});
