import { describe, expect, it } from 'vitest';

import {
  syntheticContribution,
  syntheticPublications,
} from '../../../tests/fixtures/synthetic-territory';
import { isPubliclyVisible, submitForHumanReview } from './publication-policy';

describe('règles de publication caractérisées', () => {
  it('place toujours une nouvelle contribution en relecture humaine', () => {
    const draft = {
      id: syntheticContribution.id,
      title: syntheticContribution.title,
      originalText: syntheticContribution.originalText,
    };
    const result = submitForHumanReview(draft);

    expect(result.reviewMode).toBe('human');
    expect(result.contribution.workflowState).toBe('pending-review');
  });

  it('ne rend publiques que les publications explicitement publiées', () => {
    const visibleIds = syntheticPublications.filter(isPubliclyVisible).map(({ id }) => id);

    expect(visibleIds).toEqual(['fixture-publication-published']);
  });
});
