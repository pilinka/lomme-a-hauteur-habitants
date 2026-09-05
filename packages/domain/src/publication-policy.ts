import type { Contribution, Publication } from './contracts';

export const LOT_1_CONTRACT_VERSION = 'lot-1-provisional' as const;

export interface ReviewSubmission {
  readonly contribution: Contribution;
  readonly reviewMode: 'human';
}

export function submitForHumanReview(
  contribution: Omit<Contribution, 'workflowState'>,
): ReviewSubmission {
  return {
    contribution: { ...contribution, workflowState: 'pending-review' },
    reviewMode: 'human',
  };
}

export function isPubliclyVisible(publication: Publication): boolean {
  return publication.visibilityState === 'published';
}

export function publicPublicationRule(): string {
  return 'Une proposition reste non publique tant qu’une décision humaine ne l’a pas publiée.';
}
