import { Elysia } from "elysia";
import { requireAuthPlugin } from "@/core/auth";
import { staffController } from "./staff.controller";
import {
  createStaffBody,
  updateStaffBody,
  staffIdParams,
} from "./staff.validator";

export const staffRouter = new Elysia()
  .use(requireAuthPlugin())
  .get("/api/staff/", ({ auth }) => staffController.list(auth))
  .post(
    "/api/staff/",
    ({ auth, body, set }) => {
      set.status = 201;
      return staffController.create(auth, body);
    },
    { body: createStaffBody },
  )
  .patch(
    "/api/staff/:id",
    ({ auth, params, body }) => staffController.update(auth, params.id, body),
    { params: staffIdParams, body: updateStaffBody },
  )
  .delete(
    "/api/staff/:id",
    ({ auth, params }) => staffController.remove(auth, params.id),
    {
      params: staffIdParams,
    },
  );
