import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.hoisted(() => vi.fn());
vi.mock('../../../../shared/lib/api-client', () => ({ apiClient: { get } }));

import { menuExportService } from '../menu-export.service';

describe('menuExportService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests the selected entity and format as a blob', async () => {
    const blob = new Blob(['csv']);
    get.mockResolvedValue({ data: blob });
    const createObjectURL = vi.fn().mockReturnValue('blob:url');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const createElement = vi.spyOn(document, 'createElement');

    await menuExportService.download('items', 'csv');
    const anchor = createElement.mock.results[0]?.value as HTMLAnchorElement;

    expect(get).toHaveBeenCalledWith('/menu/export/items', {
      params: { format: 'csv' },
      responseType: 'blob',
    });
    expect(anchor.download).toBe('menu-items.csv');
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:url');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    createElement.mockRestore();
    click.mockRestore();
    delete (URL as typeof URL & { createObjectURL?: unknown }).createObjectURL;
    delete (URL as typeof URL & { revokeObjectURL?: unknown }).revokeObjectURL;
  });
});
