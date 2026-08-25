import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('../../../../shared/lib/api-client', () => ({ apiClient: api }));

import { menuImportService } from '../menu-import.service';

describe('menuImportService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('downloads a template with the requested format', async () => {
    const blob = new Blob(['xlsx']);
    api.get.mockResolvedValue({ data: blob });
    const createObjectURL = vi.fn().mockReturnValue('blob:url');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await menuImportService.downloadTemplate('xlsx');
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:url');
    expect(api.get).toHaveBeenCalledWith('/menu/import/items/template', {
      params: { format: 'xlsx' },
      responseType: 'blob',
    });
    click.mockRestore();
    delete (URL as typeof URL & { createObjectURL?: unknown }).createObjectURL;
    delete (URL as typeof URL & { revokeObjectURL?: unknown }).revokeObjectURL;
  });

  it('uploads files as multipart form data for validation and commit', async () => {
    const file = new File(['name'], 'menu.csv', { type: 'text/csv' });
    const validated = { totalRows: 1, validCount: 1, preview: [], errors: [] };
    const committed = { inserted: 1, updated: 0 };
    api.post
      .mockResolvedValueOnce({ data: { data: validated } })
      .mockResolvedValueOnce({ data: { data: committed } });

    await expect(menuImportService.validate(file)).resolves.toEqual(validated);
    await expect(menuImportService.commit(file)).resolves.toEqual(committed);

    expect(api.post).toHaveBeenNthCalledWith(
      1,
      '/menu/import/items/validate',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    expect(api.post).toHaveBeenNthCalledWith(
      2,
      '/menu/import/items/commit',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  });
});
