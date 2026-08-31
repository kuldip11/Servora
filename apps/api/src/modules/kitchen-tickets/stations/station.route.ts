import { Elysia, t } from "elysia";
import { requireAuthPlugin } from "../../../core/auth";
import { createdResponse, successResponse } from "../../../core/response";
import { stationService } from "./station.service";

const stationBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  branchId: t.Optional(t.String({ format: "uuid" })),
  printerIdentifier: t.Optional(t.Union([t.String({ maxLength: 200 }), t.Null()])),
  sortOrder: t.Optional(t.Integer()),
});
const routeBody = t.Object({
  stationId: t.String({ format: "uuid" }),
  modifierOptionId: t.Optional(t.Union([t.String({ format: "uuid" }), t.Null()])),
});
const idParams = t.Object({ id: t.String({ format: "uuid" }) });

export const kitchenStationsRouter = new Elysia({ prefix: "/api/kitchen/stations" })
  .use(requireAuthPlugin())
  .get("/", async ({ auth, query }) => successResponse(await stationService.list(auth, query.branchId)), {
    query: t.Object({ branchId: t.Optional(t.String({ format: "uuid" })) }),
  })
  .post("/", async ({ auth, body }) => createdResponse(await stationService.create(auth, body)), { body: stationBody })
  .patch("/:id", async ({ auth, params, body }) => successResponse(await stationService.update(auth, params.id, body)), {
    params: idParams,
    body: t.Partial(t.Omit(stationBody, ["branchId"])),
  })
  .delete("/:id", async ({ auth, params }) => {
    await stationService.remove(auth, params.id);
    return successResponse(null);
  }, { params: idParams })
  .get("/routes/:id", async ({ auth, params }) => successResponse(await stationService.listRoutes(auth, params.id)), { params: idParams })
  .put("/routes/:id", async ({ auth, params, body }) => successResponse(await stationService.setRoute(auth, params.id, body)), {
    params: idParams, body: routeBody,
  })
  .delete("/routes/:id", async ({ auth, params, query }) => successResponse(await stationService.removeRoute(auth, params.id, query.modifierOptionId)), {
    params: idParams,
    query: t.Object({ modifierOptionId: t.Optional(t.String({ format: "uuid" })) }),
  });
