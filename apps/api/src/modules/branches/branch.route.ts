import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../core/auth";
import { branchController } from "./branch.controller";
import {
  createBranchBody,
  updateBranchBody,
  branchIdParams,
} from "./branch.validator";

export const branchesRouter = new Elysia()
  // Branch-locked staff → return only their own branch.
  // Owner/manager → return all branches, or one specific branch from the server-issued active context.
  .use(requireAuthPlugin())
  .get("/api/branches/", ({ auth }) => branchController.list(auth))
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
