import { Elysia } from "elysia";
import { requireAuthPlugin } from "@/core/auth";
import { menuController } from "./menu.controller";
import {
  activeMenusQuery,
  createMenuBody,
  menuIdParams,
  menuScheduleBody,
  updateMenuBody,
} from "./menu.validator";

export const menusRouter = new Elysia({ prefix: "/api/menu/menus" })
  .use(requireAuthPlugin())
  .get("/", ({ auth }) => menuController.list(auth))
  .get(
    "/active",
    ({ auth, query }) =>
      menuController.listActive(auth, query.channel, query.fulfillmentType),
    { query: activeMenusQuery },
  )
  .post("/", ({ auth, body }) => menuController.create(auth, body), {
    body: createMenuBody,
  })
  .get(
    "/:id/schedules",
    ({ auth, params }) => menuController.listSchedules(auth, params.id),
    { params: menuIdParams },
  )
  .post(
    "/:id/schedules",
    ({ auth, params, body }) =>
      menuController.createSchedule(auth, params.id, body),
    { params: menuIdParams, body: menuScheduleBody },
  )
  .delete(
    "/schedules/:id",
    ({ auth, params }) => menuController.deleteSchedule(auth, params.id),
    { params: menuIdParams },
  )
  .get("/:id", ({ auth, params }) => menuController.getById(auth, params.id), {
    params: menuIdParams,
  })
  .patch(
    "/:id",
    ({ auth, params, body }) => menuController.update(auth, params.id, body),
    {
      params: menuIdParams,
      body: updateMenuBody,
    },
  )
  .post(
    "/:id/publish",
    ({ auth, params }) => menuController.publish(auth, params.id),
    {
      params: menuIdParams,
    },
  )
  .post(
    "/:id/unpublish",
    ({ auth, params }) => menuController.unpublish(auth, params.id),
    {
      params: menuIdParams,
    },
  )
  .delete(
    "/:id",
    ({ auth, params }) => menuController.remove(auth, params.id),
    {
      params: menuIdParams,
    },
  );
