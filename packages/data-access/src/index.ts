import type {
  AccessibleOrganization,
  AccessibleTerritory,
  TenantDirectoryRepository,
} from '@ahh/application';
import type { ApiOrganizationRow, ApiTerritoryRow } from '@ahh/database-types';

export type DataApiRelation = 'my_organizations' | 'my_territories';

/**
 * Port minimal vers la Data API. L'adaptateur Supabase concret sera injecté au point
 * de composition ; aucun composant React ne connaît ce transport.
 */
export interface DataApiGateway {
  select<Row>(schema: 'api', relation: DataApiRelation, columns: string): Promise<readonly Row[]>;
}

const organizationColumns = 'id,slug,name,status,created_at,updated_at';
const territoryColumns = 'id,organization_id,slug,name,status,created_at,updated_at';

export class DataApiTenantDirectoryRepository implements TenantDirectoryRepository {
  constructor(private readonly gateway: DataApiGateway) {}

  async listOrganizations(): Promise<readonly AccessibleOrganization[]> {
    const rows = await this.gateway.select<ApiOrganizationRow>(
      'api',
      'my_organizations',
      organizationColumns,
    );
    return rows.map(({ id, slug, name, status }) => ({ id, slug, name, status }));
  }

  async listTerritories(): Promise<readonly AccessibleTerritory[]> {
    const rows = await this.gateway.select<ApiTerritoryRow>(
      'api',
      'my_territories',
      territoryColumns,
    );
    return rows.map(({ id, organization_id: organizationId, slug, name, status }) => ({
      id,
      organizationId,
      slug,
      name,
      status,
    }));
  }
}
