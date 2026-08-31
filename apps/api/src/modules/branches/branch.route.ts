import { Elysia } from "elysia";
import { requireAuthPlugin } from "@/core/auth";
import { branchController } from "./branch.controller";
import {
  createBranchBody,
  updateBranchBody,
  branchIdParams,
} from "./branch.validator";

export const branchesRouter = new Elysia()

  .use(requireAuthPlugin())
  .get("/api/branches/", ({ auth }) => branchController.list(auth))
  .get(
    "/api/branches/:id/takeaway-qr",
    ({ auth, params }) => branchController.getTakeawayQr(auth, params.id),
    { params: branchIdParams },
  )
  .post(
    "/api/branches/:id/takeaway-qr/regenerate",
    ({ auth, params }) =>
      branchController.regenerateTakeawayQr(auth, params.id),
    { params: branchIdParams },
  )
  .post(
    "/api/branches/",
    ({ auth, body, set }) => {
      set.status = 201;
      return branchController.create(auth, body);
    },
    { body: createBranchBody },
  )
  .patch(
    "/api/branches/:id",
    ({ auth, params, body }) => branchController.update(auth, params.id, body),
    { params: branchIdParams, body: updateBranchBody },
  )
  .delete(
    "/api/branches/:id",
    ({ auth, params }) => branchController.deactivate(auth, params.id),
    {
      params: branchIdParams,
    },
  );
