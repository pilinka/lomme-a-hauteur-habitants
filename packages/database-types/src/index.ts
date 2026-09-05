/**
 * Contrat maintenu des seules vues exposées par le schéma Data API `api`.
 * Les schémas internes `core`, `private`, `reference` et `audit` sont exclus.
 */
export type OrganizationStatus = 'active' | 'suspended' | 'archived';
export type TerritoryStatus = 'active' | 'archived';
export type MembershipStatus = 'active' | 'inactive' | 'suspended' | 'archived';
export type MembershipScopeMode = 'organization' | 'territories';

export interface ApiOrganizationRow {
  id: string;
  slug: string;
  name: string;
  status: OrganizationStatus;
  created_at: string;
  updated_at: string;
}

export interface ApiTerritoryRow {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  status: TerritoryStatus;
  created_at: string;
  updated_at: string;
}

export interface ApiMembershipRow {
  id: string;
  organization_id: string;
  user_id: string;
  status: MembershipStatus;
  scope_mode: MembershipScopeMode;
  created_at: string;
  updated_at: string;
}

export interface ApiAuditEventRow {
  id: number;
  organization_id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  outcome: string;
  created_at: string;
}

export type Database = {
  api: {
    Tables: { [_ in never]: never };
    Views: {
      my_organizations: { Row: ApiOrganizationRow; Relationships: [] };
      my_territories: { Row: ApiTerritoryRow; Relationships: [] };
      my_memberships: { Row: ApiMembershipRow; Relationships: [] };
      my_audit_events: { Row: ApiAuditEventRow; Relationships: [] };
    };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
