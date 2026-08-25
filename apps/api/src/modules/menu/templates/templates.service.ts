/**
 * Menu templates service — orchestrates `templates.repository.ts` and
 * applies the business rules that used to live inline in the monolithic
 * `menu/templates.service.ts`: category ownership checks on create,
 * not-found handling on get/apply/delete.
 */
import type { AuthContext } from '../../../core/auth';
import { templatesRepository } from './templates.repository';
import { requirePermission } from '../../../core/auth';
import { resolveMenuBranch } from '../menu-authorization';
import { templateNotFound, templateCategoryNotFound } from './templates.errors';

export const templatesService = {
  async list(auth: AuthContext) {
    requirePermission(auth, 'menu:read');
    return templatesRepository.findMany(auth.tenantId);
  },

  async get(auth: AuthContext, templateId: string) {
    requirePermission(auth, 'menu:read');
    const template = await templatesRepository.findById(auth.tenantId, templateId);
    if (!template) throw templateNotFound(templateId);
    return template;
  },

  async createFromCategory(auth: AuthContext, categoryId: string, name: string, description?: string | undefined) {
    requirePermission(auth, 'menu:create');
    const category = await templatesRepository.findCategory(auth.tenantId, categoryId);
    if (!category) throw templateCategoryNotFound(categoryId);

    // Branch-exclusive items are skipped — see the schema comment on
    // menuTemplates for why. Only tenant-wide items are snapshotted.
    const items = await templatesRepository.findTenantWideCategoryItems(auth.tenantId, categoryId);

    return templatesRepository.createFromCategory(auth.tenantId, category, name, description, items);
  },

  async apply(auth: AuthContext, templateId: string, options: { branchId?: string | undefined; categoryName?: string | undefined }) {
    requirePermission(auth, 'menu:create');
    const branchId = resolveMenuBranch(auth, options.branchId);
    const template = await templatesRepository.findById(auth.tenantId, templateId);
    if (!template) throw templateNotFound(templateId);

    return templatesRepository.apply(auth.tenantId, template, { ...options, branchId });
  },

  async delete(auth: AuthContext, templateId: string) {
    requirePermission(auth, 'menu:delete');
    const deleted = await templatesRepository.delete(auth.tenantId, templateId);
    if (!deleted) throw templateNotFound(templateId);
  },
};
