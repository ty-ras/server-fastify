# Typesafe REST API Specification - Fastify HTTP Server Related Libraries

[![CI Pipeline](https://github.com/ty-ras/server-fastify/actions/workflows/ci.yml/badge.svg)](https://github.com/ty-ras/server-fastify/actions/workflows/ci.yml)
[![CD Pipeline](https://github.com/ty-ras/server-fastify/actions/workflows/cd.yml/badge.svg)](https://github.com/ty-ras/server-fastify/actions/workflows/cd.yml)

The Typesafe REST API Specification is a family of libraries used to enable seamless development of Backend and/or Frontend which communicate via HTTP protocol.
The protocol specification is checked both at compile-time and run-time to verify that communication indeed adhers to the protocol.
This all is done in such way that it does not make development tedious or boring, but instead robust and fun!

This particular repository contains [Fastify HTTP server](https://www.fastify.io) related library, which is designed to be consumed by users of TyRAS:
- [server](./server) library exposes `createRoute` function to create Fastify route which will serve given TyRAS `AppEndpoint`s.