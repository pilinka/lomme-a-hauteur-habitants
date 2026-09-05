export interface AccessibleOrganization {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly status: 'active' | 'suspended' | 'archived';
}

export interface AccessibleTerritory {
  readonly id: string;
  readonly organizationId: string;
  readonly slug: string;
  readonly name: string;
  readonly status: 'active' | 'archived';
}

export interface TenantDirectoryRepository {
  listOrganizations(): Promise<readonly AccessibleOrganization[]>;
  listTerritories(): Promise<readonly AccessibleTerritory[]>;
}

export interface TenantContext {
  readonly organizations: readonly AccessibleOrganization[];
  readonly territories: readonly AccessibleTerritory[];
}

/** Point d'entrée applicatif : un composant dépend de ce cas d'usage, jamais du client SQL. */
export async function loadTenantContext(
  repository: TenantDirectoryRepository,
): Promise<TenantContext> {
  const [organizations, territories] = await Promise.all([
    repository.listOrganizations(),
    repository.listTerritories(),
  ]);

  return { organizations, territories };
}
