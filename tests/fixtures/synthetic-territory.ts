import type { Contribution, Publication } from '@ahh/domain';

export const dataClassification = 'synthetic-demo' as const;

export const syntheticContribution: Contribution = {
  id: 'fixture-contribution-pending',
  title: 'Traversée piétonne à observer',
  originalText: 'Scénario entièrement synthétique réservé aux tests.',
  participantContext: 'resident',
  workflowState: 'draft',
};

export const syntheticPublications: readonly Publication[] = [
  {
    id: 'fixture-publication-published',
    derivedFrom: 'fixture-contribution-published',
    publicTitle: 'Le banc sous les tilleuls — scénario fictif',
    publicText: 'Contenu de test synthétique sans correspondance territoriale réelle.',
    visibilityState: 'published',
  },
  {
    id: 'fixture-publication-pending',
    derivedFrom: syntheticContribution.id,
    publicTitle: syntheticContribution.title,
    publicText: syntheticContribution.originalText,
    visibilityState: 'pending-review',
  },
  {
    id: 'fixture-publication-withdrawn',
    derivedFrom: 'fixture-contribution-withdrawn',
    publicTitle: 'Initiative périmée — scénario fictif',
    publicText: 'Cette entrée synthétique doit rester hors valorisation.',
    visibilityState: 'withdrawn',
  },
];
