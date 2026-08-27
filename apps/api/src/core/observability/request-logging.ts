import { Elysia } from "elysia";
import { rootLogger } from "../logger";
import { requestContextPlugin } from "../context";

export const requestLoggingPlugin = () =>
  new Elysia({ name: "request-logging" })
    .use(requestContextPlugin())
    .onAfterHandle(
      { as: "global" },
      ({ request, set, requestContext }) => {
        const url = new URL(request.url);
        rootLogger.info("request.completed", {
          requestId: requestContext.requestId,
          method: request.method,
          path: url.pathname,
          statusCode: set.status || 200,
          durationMs: Date.now() - requestContext.startTime,
        });
      },
    );
