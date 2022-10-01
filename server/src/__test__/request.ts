import * as http from "http";
import type * as stream from "stream";

export const requestAsync = (
  opts: http.RequestOptions,
  write?: (writeable: stream.Writable) => Promise<void>,
) =>
  new Promise<{
    headers: http.IncomingHttpHeaders;
    data: string | undefined;
  }>((resolve, reject) => {
    const writeable = http
      .request(opts, (resp) => {
        resp.setEncoding("utf8");
        let data: string | undefined;
        const headers = resp.headers;
        const statusCode = resp.statusCode;

        // A chunk of data has been received.
        resp.on("data", (chunk: string) => {
          if (data === undefined) {
            data = chunk;
          } else {
            data += chunk;
          }
        });

        // The whole response has been received. Print out the result.
        resp.on("end", () => {
          if (statusCode === undefined || statusCode >= 400) {
            reject(new RequestError(statusCode, getErrorMessage(statusCode)));
          } else {
            resolve({
              headers,
              data,
            });
          }
        });
      })
      .on("error", (err) => {
        reject(err);
      });
    if (write) {
      void awaitAndThen(write(writeable), () => writeable.end(), reject);
    } else {
      writeable.end();
    }
  });

const awaitAndThen = async (
  awaitable: Promise<void>,
  onEnd: () => void,
  reject: (err: unknown) => void,
) => {
  try {
    await awaitable;
    onEnd();
  } catch (e) {
    reject(e);
  }
};

export class RequestError extends Error {
  public constructor(
    public readonly statusCode: number | undefined,
    message: string,
  ) {
    super(message);
  }
}

export const getErrorMessage = (statusCode: number | undefined) =>
  `Status code: ${statusCode}`;
