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

export const menuModifiersRouter = new Elysia({ prefix: "/api/menu" })
  .use(requireAuthPlugin())

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

  .get("/allergens", ({ auth }) => modifierController.listAllergens(auth));
