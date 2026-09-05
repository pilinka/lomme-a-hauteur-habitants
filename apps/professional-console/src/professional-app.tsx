import { useEffect, useRef } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { publicPublicationRule } from '@ahh/domain';
import { AppShell, PageTitle, StatusMessage } from '@ahh/ui';

function RouteEffects() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    const pageTitle = document.querySelector<HTMLElement>('[data-page-title]');
    const title = pageTitle?.textContent?.trim() ?? 'Console professionnelle';
    document.title = `${title} — Console À hauteur d’habitants`;
    if (previousPath.current !== pathname) pageTitle?.focus();
    previousPath.current = pathname;
  }, [pathname]);

  return null;
}

function Navigation() {
  return (
    <nav className="site-navigation" aria-label="Navigation professionnelle">
      <ul>
        <li>
          <NavLink to="/">Accueil</NavLink>
        </li>
        <li>
          <NavLink to="/contributions">Contributions</NavLink>
        </li>
        <li>
          <NavLink to="/qualite">Qualité des données</NavLink>
        </li>
        <li>
          <NavLink to="/connexion">Connexion</NavLink>
        </li>
      </ul>
    </nav>
  );
}

function ConsoleHomePage() {
  return (
    <>
      <PageTitle>Console professionnelle</PageTitle>
      <StatusMessage>
        Coque technique uniquement : aucun compte, rôle, backend ou contenu V3 n’est connecté.
      </StatusMessage>
      <p>{publicPublicationRule()}</p>
      <div className="console-grid">
        <article>
          <h2>Recenser et suivre</h2>
          <p>Emplacement réservé aux futurs flux territoriaux qualifiés.</p>
        </article>
        <article>
          <h2>Relire avant publication</h2>
          <p>La décision humaine demeure un invariant ; son workflow sera conçu au Lot 2.</p>
        </article>
      </div>
    </>
  );
}

function PlaceholderPage({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
  return (
    <>
      <PageTitle>{title}</PageTitle>
      <p>{description}</p>
      <StatusMessage>Aucune donnée professionnelle n’est disponible dans le Lot 1.</StatusMessage>
    </>
  );
}

function ConnectionPage() {
  return (
    <>
      <PageTitle>Connexion professionnelle</PageTitle>
      <p>
        Cette route technique n’est reliée à aucun fournisseur d’identité. Les anciens comptes et
        sessions V3 ne seront jamais repris automatiquement.
      </p>
      <Link to="/recuperation">Route de récupération de compte</Link>
    </>
  );
}

function NotFoundPage() {
  return (
    <>
      <PageTitle>Page professionnelle introuvable</PageTitle>
      <p>Cette adresse ne correspond à aucune route de la console.</p>
      <Link to="/">Revenir à l’accueil de la console</Link>
    </>
  );
}

export function ProfessionalApp() {
  return (
    <AppShell appName="À hauteur d’habitants — espace professionnel" navigation={<Navigation />}>
      <RouteEffects />
      <Routes>
        <Route path="/" element={<ConsoleHomePage />} />
        <Route
          path="/contributions"
          element={
            <PlaceholderPage
              title="Contributions à relire"
              description="Route réservée à la future file de relecture humaine."
            />
          }
        />
        <Route
          path="/qualite"
          element={
            <PlaceholderPage
              title="Qualité des données"
              description="Route réservée à la provenance, la vérification et les échéances de revue."
            />
          }
        />
        <Route path="/connexion" element={<ConnectionPage />} />
        <Route
          path="/recuperation"
          element={
            <PlaceholderPage
              title="Récupération de compte"
              description="Besoin fonctionnel conservé, sans reprise de l’implémentation ou des comptes V3."
            />
          }
        />
        <Route
          path="/acces-refuse"
          element={
            <PlaceholderPage
              title="Accès refusé"
              description="État d’interface uniquement ; la sécurité serveur sera traitée au Lot 2."
            />
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
