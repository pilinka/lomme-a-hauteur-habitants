import axe from 'axe-core';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { PublicApp } from './public-app';

describe('accessibilité automatique publique', () => {
  it.each([
    '/',
    '/explorer/liste',
    '/contribuer',
    '/participation-enfants',
    '/protection',
    '/evolutions',
    '/route-inconnue',
  ])('ne présente aucune violation détectée sur %s', async (route) => {
    const { container } = render(
      <MemoryRouter initialEntries={[route]}>
        <PublicApp />
      </MemoryRouter>,
    );

    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
