import { describe, expect, it, vi } from 'vitest';
import { loadTenantContext, type TenantDirectoryRepository } from './index';

describe('loadTenantContext', () => {
  it('coordonne le port de lecture sans dépendance au transport', async () => {
    const repository: TenantDirectoryRepository = {
      listOrganizations: vi
        .fn()
        .mockResolvedValue([
          { id: 'org-a', slug: 'synthetic-a', name: 'Synthetic A', status: 'active' },
        ]),
      listTerritories: vi.fn().mockResolvedValue([
        {
          id: 'territory-a',
          organizationId: 'org-a',
          slug: 'synthetic-a-one',
          name: 'Synthetic A One',
          status: 'active',
        },
      ]),
    };

    await expect(loadTenantContext(repository)).resolves.toEqual({
      organizations: [{ id: 'org-a', slug: 'synthetic-a', name: 'Synthetic A', status: 'active' }],
      territories: [
        {
          id: 'territory-a',
          organizationId: 'org-a',
          slug: 'synthetic-a-one',
          name: 'Synthetic A One',
          status: 'active',
        },
      ],
    });
  });
});
