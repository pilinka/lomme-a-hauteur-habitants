/**
 * Contrats de compilation provisoires du Lot 1.
 *
 * @experimental Ces types ne décrivent ni un schéma SQL, ni des règles RLS,
 * ni le futur modèle multi-collectivité. Ils seront réexaminés au Lot 2.
 */
export type ProvisionalId = string;
export type WorkflowState = string;
export type VerificationLevel = string;

export interface OrganizationRef {
  readonly id: ProvisionalId;
  readonly label: string;
}

export interface TerritoryRef {
  readonly id: ProvisionalId;
  readonly label: string;
}

export interface UserRef {
  readonly id: ProvisionalId;
  readonly displayLabel?: string;
}

export interface LocationRef {
  /** Référence opaque ; sa géométrie et sa précision seront définies au Lot 2. */
  readonly areaRef?: ProvisionalId;
  /** Libellé public non adressant, sans coordonnées ni adresse précise. */
  readonly publicLabel?: string;
}

export interface Contribution {
  readonly id: ProvisionalId;
  readonly title: string;
  readonly originalText: string;
  readonly kind?: string;
  readonly feeling?: string;
  readonly location?: LocationRef;
  readonly collectionChannel?: string;
  readonly participantContext?: 'resident' | 'accompanied-child' | 'organization';
  readonly workflowState: WorkflowState;
}

export interface Publication {
  readonly id: ProvisionalId;
  readonly derivedFrom: ProvisionalId;
  readonly publicTitle: string;
  readonly publicText: string;
  readonly publishedAt?: string;
  readonly visibilityState: WorkflowState;
}

export interface LocalStructure {
  readonly id: ProvisionalId;
  readonly name: string;
  readonly description?: string;
  readonly territory?: TerritoryRef;
}

export interface Initiative {
  readonly id: ProvisionalId;
  readonly name: string;
  readonly description?: string;
  readonly carriedBy?: ProvisionalId;
  readonly territory?: TerritoryRef;
  readonly startsAt?: string;
  readonly endsAt?: string;
}

export interface Source {
  readonly id: ProvisionalId;
  readonly label: string;
  readonly capturedAt?: string;
  readonly reference?: string;
}

export interface Verification {
  readonly id: ProvisionalId;
  readonly subjectRef: ProvisionalId;
  readonly sourceRefs: readonly ProvisionalId[];
  readonly checkedAt?: string;
  readonly level: VerificationLevel;
}

export interface FollowUp {
  readonly id: ProvisionalId;
  readonly subjectRef: ProvisionalId;
  readonly summary: string;
  readonly recordedAt?: string;
  readonly state: WorkflowState;
}
