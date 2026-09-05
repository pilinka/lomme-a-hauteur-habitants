import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { publicPublicationRule, submitForHumanReview } from '@ahh/domain';
import { AppShell, Button, PageTitle, StatusMessage, TextField } from '@ahh/ui';

function RouteEffects() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    const pageTitle = document.querySelector<HTMLElement>('[data-page-title]');
    const title = pageTitle?.textContent?.trim() ?? 'À hauteur d’habitants';
    document.title = `${title} — À hauteur d’habitants`;
    if (previousPath.current !== pathname) pageTitle?.focus();
    previousPath.current = pathname;
  }, [pathname]);

  return null;
}

function Navigation() {
  return (
    <nav className="site-navigation" aria-label="Navigation publique">
      <ul>
        <li>
          <NavLink to="/">Accueil</NavLink>
        </li>
        <li>
          <NavLink to="/explorer/carte">Explorer</NavLink>
        </li>
        <li>
          <NavLink to="/contribuer">Contribuer</NavLink>
        </li>
        <li>
          <NavLink to="/protection">Protection</NavLink>
        </li>
      </ul>
    </nav>
  );
}

function HomePage() {
  return (
    <>
      <PageTitle>Le quartier à hauteur d’habitants</PageTitle>
      <p className="lead">
        Une plateforme de mémoire territoriale qui conserve la cartographie sensible et la
        participation habitante.
      </p>
      <section className="intent-grid" aria-label="Trois fonctions de la plateforme">
        <article>
          <h2>Connaître mon quartier</h2>
          <p>Découvrir les lieux, ressources et initiatives dans une carte ou une liste.</p>
          <Link to="/explorer/carte">Commencer à explorer</Link>
        </article>
        <article>
          <h2>Partager ce que j’y vis</h2>
          <p>Proposer un vécu, un besoin ou une idée, sans publication automatique.</p>
          <Link to="/contribuer">Voir le parcours de contribution</Link>
        </article>
        <article>
          <h2>Comprendre ce qui évolue</h2>
          <p>Suivre la mémoire du territoire et les suites données, sans fil social.</p>
          <Link to="/evolutions">Comprendre le principe</Link>
        </article>
      </section>
    </>
  );
}

function ExplorerPage({ view }: { readonly view: 'carte' | 'liste' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const otherView = view === 'carte' ? 'liste' : 'carte';
  const search = searchParams.toString();

  return (
    <>
      <PageTitle>Découvrir mon quartier — vue {view}</PageTitle>
      <p>
        Le Lot 1 pose un contrat : carte et liste devront utiliser le même résultat filtré. Aucun
        corpus réel ou de démonstration n’est chargé ici.
      </p>
      <nav className="view-switcher" aria-label="Choisir une vue">
        <Link to={{ pathname: `/explorer/${otherView}`, search: search ? `?${search}` : '' }}>
          Passer à la vue {otherView}
        </Link>
      </nav>
      <TextField
        id="explorer-recherche"
        label="Rechercher dans le quartier"
        hint="Le filtre est conservé dans l’URL et devra produire les mêmes résultats dans les deux vues."
        onChange={(event) => {
          const next = new URLSearchParams(searchParams);
          if (event.target.value) next.set('q', event.target.value);
          else next.delete('q');
          setSearchParams(next, { replace: true });
        }}
        value={query}
      />
      {view === 'carte' ? (
        <section className="map-foundation" aria-labelledby="map-title">
          <h2 id="map-title">Emplacement de la future carte</h2>
          <p>La carte sensible sera introduite dans un lot fonctionnel ultérieur.</p>
        </section>
      ) : (
        <section aria-labelledby="list-title">
          <h2 id="list-title">Résultats territoriaux</h2>
          <p>Aucun résultat : le socle ne contient volontairement aucune donnée territoriale.</p>
        </section>
      )}
      <StatusMessage>0 résultat public dans ce socle technique.</StatusMessage>
    </>
  );
}

function ContributionPage() {
  const [confirmation, setConfirmation] = useState('');
  const [formError, setFormError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get('title') ?? '').trim();
    const originalText = String(form.get('content') ?? '').trim();

    if (!title || !originalText) {
      setConfirmation('');
      setFormError('Ajoutez un titre et une contribution avant de vérifier le parcours.');
      return;
    }

    const result = submitForHumanReview({
      id: 'local-unsaved-preview',
      title,
      originalText,
      collectionChannel: 'lot-1-interface-preview',
    });

    setConfirmation(
      result.contribution.workflowState === 'pending-review'
        ? 'Parcours vérifié : la proposition attendrait une relecture humaine. Aucune donnée n’a été envoyée.'
        : '',
    );
    setFormError('');
    event.currentTarget.reset();
  }

  return (
    <>
      <PageTitle>Partager ce que je vis</PageTitle>
      <p>{publicPublicationRule()}</p>
      <p className="form-guidance" role="note">
        Pour protéger les personnes, ne saisissez pas de nom, d’adresse précise, de numéro de
        téléphone, d’accusation nominative ou de photographie sensible. Cette démonstration ne
        transmet ni ne conserve votre saisie.
      </p>
      <form onSubmit={handleSubmit}>
        <TextField label="Titre de la proposition" name="title" required />
        <div className="field">
          <label htmlFor="contribution-content">Votre contribution *</label>
          <span className="field__hint" id="contribution-content-hint">
            Démonstration locale du parcours uniquement ; le texte n’est ni stocké ni transmis.
          </span>
          <textarea
            aria-describedby="contribution-content-hint"
            className="text-area"
            id="contribution-content"
            name="content"
            required
            rows={6}
          />
        </div>
        <Button type="submit">Vérifier le parcours</Button>
      </form>
      <p>
        <Link to="/participation-enfants">Pour un atelier accompagné avec des enfants</Link>
      </p>
      {formError ? <StatusMessage kind="error">{formError}</StatusMessage> : null}
      {confirmation ? <StatusMessage>{confirmation}</StatusMessage> : null}
    </>
  );
}

function ChildrenPage() {
  return (
    <>
      <PageTitle>Participation des enfants</PageTitle>
      <p>
        Le futur parcours restera anonyme et accompagné. Le Lot 1 n’enregistre aucun récit, nom,
        établissement ou autre donnée d’enfant.
      </p>
    </>
  );
}

function ProtectionPage() {
  return (
    <>
      <PageTitle>Protection des personnes et des données</PageTitle>
      <p>
        Ce socle fonctionne sans backend, authentification, télémétrie ni stockage distant. Une
        saisie de démonstration peut rester affichée localement jusqu’à la vérification du parcours,
        mais elle n’est ni transmise ni persistée. Les politiques complètes seront validées avant
        tout traitement réel.
      </p>
    </>
  );
}

function EvolutionsPage() {
  return (
    <>
      <PageTitle>Comprendre ce qui évolue</PageTitle>
      <p>
        Cette route réserve la future lecture temporelle et la notion légère de suite donnée. Elle
        ne constitue pas un outil de gestion de projets.
      </p>
    </>
  );
}

function NotFoundPage() {
  return (
    <>
      <PageTitle>Page introuvable</PageTitle>
      <p>Cette adresse ne correspond à aucune route publique du socle.</p>
      <Link to="/">Revenir à l’accueil</Link>
    </>
  );
}

export function PublicApp() {
  return (
    <AppShell appName="À hauteur d’habitants" navigation={<Navigation />}>
      <RouteEffects />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explorer/carte" element={<ExplorerPage view="carte" />} />
        <Route path="/explorer/liste" element={<ExplorerPage view="liste" />} />
        <Route path="/contribuer" element={<ContributionPage />} />
        <Route path="/participation-enfants" element={<ChildrenPage />} />
        <Route path="/protection" element={<ProtectionPage />} />
        <Route path="/evolutions" element={<EvolutionsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
