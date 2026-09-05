import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Button, Dialog, TextField } from './components';

describe('composants accessibles partagés', () => {
  it('relie aide et erreur au champ', () => {
    render(<TextField error="Valeur incorrecte" hint="Aide utile" label="Nom public" />);

    const field = screen.getByRole('textbox', { name: 'Nom public' });
    expect(field).toHaveAccessibleDescription('Aide utile Valeur incorrecte');
    expect(field).toHaveAttribute('aria-invalid', 'true');
  });

  it('conserve une description fournie par le consommateur', () => {
    render(
      <TextField aria-describedby="description-externe" label="Nom public" hint="Aide utile" />,
    );

    expect(screen.getByRole('textbox', { name: 'Nom public' })).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('description-externe'),
    );
  });

  it('place le focus dans le dialogue puis le restitue au déclencheur', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Ouvrir les règles</Button>
          <Dialog open={open} title="Règles de contribution" onClose={() => setOpen(false)}>
            <p>Contenu synthétique de test.</p>
          </Dialog>
        </>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Ouvrir les règles' });
    await user.click(trigger);

    const closeButton = screen.getByRole('button', { name: 'Fermer' });
    expect(closeButton).toHaveFocus();
    await user.click(closeButton);
    expect(trigger).toHaveFocus();
  });
});
