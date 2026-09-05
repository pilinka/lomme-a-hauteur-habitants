import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { PublicApp } from './public-app';

function renderRoute(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <PublicApp />
    </MemoryRouter>,
  );
}

describe('application publique', () => {
  it('expose les trois fonctions validées dès l’accueil', () => {
    renderRoute('/');

    expect(screen.getByRole('heading', { name: 'Connaître mon quartier' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Partager ce que j’y vis' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Comprendre ce qui évolue' })).toBeInTheDocument();
  });

  it('conserve les filtres en passant de la carte à la liste', async () => {
    const user = userEvent.setup();
    renderRoute('/explorer/carte?q=tilleuls');

    const switchLink = screen.getByRole('link', { name: 'Passer à la vue liste' });
    expect(switchLink).toHaveAttribute('href', '/explorer/liste?q=tilleuls');
    await user.click(switchLink);
    const pageTitle = screen.getByRole('heading', { level: 1 });
    expect(pageTitle).toHaveTextContent('vue liste');
    expect(pageTitle).toHaveFocus();
    expect(screen.getByRole('textbox', { name: 'Rechercher dans le quartier' })).toHaveValue(
      'tilleuls',
    );
  });

  it('ne simule jamais une publication automatique', async () => {
    const user = userEvent.setup();
    renderRoute('/contribuer');

    await user.type(screen.getByRole('textbox', { name: /Titre de la proposition/ }), 'Essai');
    await user.type(
      screen.getByRole('textbox', { name: /Votre contribution/ }),
      'Texte synthétique',
    );
    await user.click(screen.getByRole('button', { name: 'Vérifier le parcours' }));

    expect(screen.getByRole('status')).toHaveTextContent('attendrait une relecture humaine');
    expect(screen.getByRole('status')).toHaveTextContent('Aucune donnée n’a été envoyée');
    expect(screen.getByRole('textbox', { name: /Titre de la proposition/ })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /Votre contribution/ })).toHaveValue('');
  });

  it('refuse une contribution composée uniquement d’espaces', async () => {
    const user = userEvent.setup();
    renderRoute('/contribuer');

    await user.type(screen.getByRole('textbox', { name: /Titre de la proposition/ }), '   ');
    await user.type(screen.getByRole('textbox', { name: /Votre contribution/ }), '   ');
    await user.click(screen.getByRole('button', { name: 'Vérifier le parcours' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Ajoutez un titre et une contribution');
  });

  it('réserve un parcours enfant sans collecte nominative au Lot 1', () => {
    renderRoute('/participation-enfants');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Participation des enfants',
    );
    expect(screen.getByText(/anonyme et accompagné/)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
