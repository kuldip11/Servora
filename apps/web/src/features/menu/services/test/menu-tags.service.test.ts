import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));
vi.mock('../../../../shared/lib/api-client', () => ({ apiClient: api }));

import { menuTagsService } from '../menu-tags.service';

describe('menuTagsService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists tags', async () => {
    const data = [{ id: 't1', name: 'Popular' }];
    api.get.mockResolvedValue({ data: { data } });
    await expect(menuTagsService.list()).resolves.toEqual(data);
    expect(api.get).toHaveBeenCalledWith('/menu/tags');
  });

  it('creates and removes tags', async () => {
    const tag = { id: 't1', name: 'Popular' };
    api.post.mockResolvedValue({ data: { data: tag } });
    await expect(menuTagsService.create('Popular', '#fff')).resolves.toEqual(tag);
    expect(api.post).toHaveBeenCalledWith('/menu/tags', { name: 'Popular', color: '#fff' });

    await menuTagsService.remove('t1');
    expect(api.delete).toHaveBeenCalledWith('/menu/tags/t1');
  });
});
