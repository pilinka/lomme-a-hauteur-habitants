import axe from 'axe-core';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { ProfessionalApp } from './professional-app';

function renderRoute(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ProfessionalApp />
    </MemoryRouter>,
  );
}

describe('console professionnelle', () => {
  it('reste explicitement déconnectée de tout compte et contenu V3', () => {
    renderRoute('/');

    expect(screen.getByRole('status')).toHaveTextContent(
      'aucun compte, rôle, backend ou contenu V3',
    );
  });

  it('expose la récupération de compte comme besoin sans fournisseur actif', () => {
    renderRoute('/recuperation');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Récupération de compte');
    expect(screen.getByRole('status')).toHaveTextContent('Aucune donnée professionnelle');
  });

  it.each([
    '/',
    '/connexion',
    '/recuperation',
    '/contributions',
    '/qualite',
    '/acces-refuse',
    '/route-inconnue',
  ])('ne présente aucune violation automatique détectée sur %s', async (route) => {
    const { container } = renderRoute(route);
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
