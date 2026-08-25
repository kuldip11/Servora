import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../../core/auth";
import { modifierController } from "./modifier.controller";
import {
  createModifierGroupBody,
  updateModifierGroupBody,
  modifierGroupIdParams,
  modifierOptionIdParams,
  setOptionAvailabilityBody,
  createTagBody,
  tagIdParams,
} from "./modifier.validator";

// Mounted at the same base prefix as the legacy `menuRouter` and the
// `availability` sub-router (this sub-domain's routes — /modifier-groups,
// /modifier-options/:id/availability, /tags, /allergens — don't share a
// clean common sub-path either). No path collisions with the legacy router
// or the other menu sub-routers (verified — see docs/NEXT_STEPS.md).
export const menuModifiersRouter = new Elysia({ prefix: "/api/menu" })
  .use(requireAuthPlugin())

  // ─── Modifier Groups ───────────────────────────────────────────────────────
  .get("/modifier-groups", ({ auth }) => modifierController.listGroups(auth))
  .post(
    "/modifier-groups",
    ({ auth, body, set }) => {
      set.status = 201;
      return modifierController.createGroup(auth, body);
    },
    { body: createModifierGroupBody },
  )
  .patch(
    "/modifier-groups/:id",
    ({ auth, params, body }) =>
      modifierController.updateGroup(auth, params.id, body),
    { params: modifierGroupIdParams, body: updateModifierGroupBody },
  )
  // Delete rather than deactivate — matches the legacy route exactly (no
  // "still referenced by items" guard exists here today; see
  // docs/NEXT_STEPS.md if that's worth adding as a follow-up).
  .delete(
    "/modifier-groups/:id",
    ({ auth, params }) => modifierController.deleteGroup(auth, params.id),
    {
      params: modifierGroupIdParams,
    },
  )
  .patch(
    "/modifier-options/:id/availability",
    ({ auth, params, body }) =>
      modifierController.setOptionAvailability(
        auth,
        params.id,
        body.isAvailable,
      ),
    { params: modifierOptionIdParams, body: setOptionAvailabilityBody },
  )

  // ─── Tags ──────────────────────────────────────────────────────────────────
  .get("/tags", ({ auth }) => modifierController.listTags(auth))
  .post(
    "/tags",
    ({ auth, body, set }) => {
      set.status = 201;
      return modifierController.createTag(auth, body);
    },
    { body: createTagBody },
  )
  .delete(
    "/tags/:id",
    ({ auth, params }) => modifierController.deleteTag(auth, params.id),
    {
      params: tagIdParams,
    },
  )

  // ─── Allergens (fixed, seeded list — read only) ────────────────────────────
  .get("/allergens", ({ auth }) => modifierController.listAllergens(auth));
