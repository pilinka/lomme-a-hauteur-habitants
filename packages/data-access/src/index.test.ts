import { describe, expect, it } from 'vitest';
import {
  DataApiTenantDirectoryRepository,
  type DataApiGateway,
  type DataApiRelation,
} from './index';

describe('DataApiTenantDirectoryRepository', () => {
  it('interroge uniquement les projections api avec des colonnes explicites', async () => {
    const calls: Array<[string, string, string]> = [];
    const gateway: DataApiGateway = {
      async select<Row>(
        schema: 'api',
        relation: DataApiRelation,
        columns: string,
      ): Promise<readonly Row[]> {
        calls.push([schema, relation, columns]);
        const rows =
          relation === 'my_organizations'
            ? [
                {
                  id: 'org-a',
                  slug: 'synthetic-a',
                  name: 'Synthetic A',
                  status: 'active',
                  created_at: '2026-01-01T00:00:00Z',
                  updated_at: '2026-01-01T00:00:00Z',
                },
              ]
            : [];
        return rows as unknown as readonly Row[];
      },
    };
    const repository = new DataApiTenantDirectoryRepository(gateway);

    await expect(repository.listOrganizations()).resolves.toHaveLength(1);
    await expect(repository.listTerritories()).resolves.toEqual([]);
    expect(calls[0]).toEqual([
      'api',
      'my_organizations',
      'id,slug,name,status,created_at,updated_at',
    ]);
    expect(calls[1]).toEqual([
      'api',
      'my_territories',
      'id,organization_id,slug,name,status,created_at,updated_at',
    ]);
  });
});
