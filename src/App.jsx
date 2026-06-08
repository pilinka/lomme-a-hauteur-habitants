import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  GeoJSON,
  ImageOverlay,
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
  WMSTileLayer,
} from "react-leaflet";
import { supabase } from "./supabaseClient.js";
import { melmapWmsLayers } from "./melmap.config.js";
import {
  emotionIcon,
  initialContributions,
  initialVieLocale,
  lommeBounds,
  lommeCenter,
  quartiersBounds,
  quartiersGeoJson,
  typeIcon,
} from "./data/mapData.js";

const quartiers = ["Bourg", "Délivrance", "Marais", "Mitterie", "Mont-à-Camp"];
const typesHabitants = ["Photo", "Souvenir", "Lieu aimé", "Lieu évité", "Idée d’aménagement"];
const typesEnfants = ["Dessin d’enfant", "Phrase d’enfant", "Poème", "Lieu aimé", "Lieu évité", "Idée d’aménagement"];
const emotions = ["joie", "calme", "peur", "tristesse", "colère", "attachement", "curiosité"];

const layerLabels = {
  regards: "Regards habitants",
  enfants: "Ville à hauteur d’enfants",
  "vie-locale": "Vie locale",
  idees: "Idées pour demain",
};

function makeIcon(item) {
  const icon = typeIcon[item.type] || typeIcon[item.category] || "📍";
  const cssClass = item.layer ? `custom-pin custom-pin-${item.layer}` : "custom-pin";
  return L.divIcon({
    html: `<span>${icon}</span>`,
    className: cssClass,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -39],
  });
}

function ZoomToBounds({ targetBounds }) {
  const map = useMap();
  useEffect(() => {
    if (targetBounds) {
      map.fitBounds(targetBounds, { padding: [28, 28], maxZoom: 16 });
    }
  }, [map, targetBounds]);
  return null;
}

function MapClickCapture({ onMapClick }) {
  useMapEvents({
    click(event) {
      onMapClick([event.latlng.lat, event.latlng.lng]);
    },
  });
  return null;
}

export default function App() {
  const [page, setPage] = useState("accueil");
  const [contributions, setContributions] = useState(initialContributions);
  const [vieLocale] = useState(initialVieLocale);
  const [session, setSession] = useState(null);
  const [pendingContributions, setPendingContributions] = useState([]);
  const [adminContributions, setAdminContributions] = useState([]);
  const [adminMessage, setAdminMessage] = useState("");
  const [adminLoginAttempts, setAdminLoginAttempts] = useState(0);
  const [adminLockUntil, setAdminLockUntil] = useState(null);
  const [passwordRecoveryOpen, setPasswordRecoveryOpen] = useState(false);
const [newAdminPassword, setNewAdminPassword] = useState("");
const [confirmAdminPassword, setConfirmAdminPassword] = useState("");
const [passwordRecoveryMessage, setPasswordRecoveryMessage] = useState("");
  const [selected, setSelected] = useState(initialContributions[0]);
  const [draftPoint, setDraftPoint] = useState(null);
  const [zoomTarget, setZoomTarget] = useState(quartiersBounds["Toute la ville"]);

  const [visibleLayers, setVisibleLayers] = useState({
    regards: true,
    enfants: true,
    "vie-locale": true,
    idees: true,
  });

  const [filters, setFilters] = useState({
    quartier: "Tous",
    emotion: "Tous",
    query: "",
  });

  const allItems = useMemo(() => [...contributions, ...vieLocale], [contributions, vieLocale]);

  const filteredItems = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return allItems.filter((item) => {
      if (!visibleLayers[item.layer]) return false;
      if (filters.quartier !== "Tous" && item.quartier !== filters.quartier) return false;
      if (filters.emotion !== "Tous" && item.emotion !== filters.emotion) return false;
      if (!q) return true;
      return [item.title, item.description, item.type, item.category, item.quartier]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q));
    });
  }, [allItems, filters, visibleLayers]);

  function toggleLayer(layer) {
    setVisibleLayers((current) => ({ ...current, [layer]: !current[layer] }));
  }

  function zoomQuartier(name) {
    setZoomTarget(quartiersBounds[name]);
    setFilters((current) => ({ ...current, quartier: name === "Toute la ville" ? "Tous" : name }));
    setPage("carte");
  }

  useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session);
  });

  const { data: authListener } = supabase.auth.onAuthStateChange(
    (event, currentSession) => {
      setSession(currentSession);

      if (event === "PASSWORD_RECOVERY") {
        setPage("urbanistes");
        setPasswordRecoveryOpen(true);
        setPasswordRecoveryMessage("Saisis un nouveau mot de passe administrateur.");
      }
    }
  );

  return () => {
    authListener.subscription.unsubscribe();
  };
}, []);

async function updateRecoveredPassword() {
  if (newAdminPassword.length < 8) {
    setPasswordRecoveryMessage("Le mot de passe doit contenir au moins 8 caractères.");
    return;
  }

  if (newAdminPassword !== confirmAdminPassword) {
    setPasswordRecoveryMessage("Les deux mots de passe ne correspondent pas.");
    return;
  }

  setPasswordRecoveryMessage("Mise à jour du mot de passe en cours...");

  const { error } = await supabase.auth.updateUser({
    password: newAdminPassword,
  });

  if (error) {
    console.error(error);
    setPasswordRecoveryMessage("Le mot de passe n’a pas pu être mis à jour.");
    return;
  }

  setPasswordRecoveryMessage("Mot de passe mis à jour. Tu peux maintenant te reconnecter.");
  setNewAdminPassword("");
  setConfirmAdminPassword("");

  setTimeout(async () => {
    setPasswordRecoveryOpen(false);
    await supabase.auth.signOut();
    setSession(null);
    setAdminMessage("Mot de passe mis à jour. Connecte-toi avec le nouveau mot de passe.");
  }, 1200);
}

async function updateRecoveredPassword() {

  if (newAdminPassword.length < 8) {

    setPasswordRecoveryMessage("Le mot de passe doit contenir au moins 8 caractères.");

    return;

  }



  if (newAdminPassword !== confirmAdminPassword) {

    setPasswordRecoveryMessage("Les deux mots de passe ne correspondent pas.");

    return;

  }



  setPasswordRecoveryMessage("Mise à jour du mot de passe en cours...");



  const { error } = await supabase.auth.updateUser({

    password: newAdminPassword,

  });



  if (error) {

    console.error(error);

    setPasswordRecoveryMessage("Le mot de passe n’a pas pu être mis à jour.");

    return;

  }



  setPasswordRecoveryMessage("Mot de passe mis à jour. Tu peux maintenant te reconnecter.");

  setNewAdminPassword("");

  setConfirmAdminPassword("");



  setTimeout(async () => {

    setPasswordRecoveryOpen(false);

    await supabase.auth.signOut();

    setSession(null);

    setAdminMessage("Mot de passe mis à jour. Connecte-toi avec le nouveau mot de passe.");

  }, 1200);

}

useEffect(() => {
  loadPublishedContributions();
}, []);

useEffect(() => {
  if (session) {
    loadPendingContributions();
  } else {
    setPendingContributions([]);
  }
}, [session]);

function formatContributionFromDb(item) {
  const latitude = Number(item.latitude);
  const longitude = Number(item.longitude);

  return {
    id: item.id,
    layer: item.layer || "regards",
    title: item.title,
    quartier: item.quartier,
    type: item.type,
    emotion: item.emotion,
    description: item.description,
    media: item.media_url || "📎 Média",
    position: [latitude, longitude],
    status: item.status,
    created_at: item.created_at,
  };
}

async function loadPublishedContributions() {
  const { data, error } = await supabase
    .from("contributions")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const publishedFromDb = (data || [])
    .filter((item) => item.latitude !== null && item.longitude !== null)
    .map(formatContributionFromDb);

  setContributions([...initialContributions, ...publishedFromDb]);
}

async function loadPendingContributions() {
  const { data, error } = await supabase
    .from("contributions")
    .select("*")
    .in("status", ["pending", "published", "rejected", "archived"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    setAdminMessage("Impossible de charger les contributions de modération.");
    return;
  }

  const formatted = (data || []).map(formatContributionFromDb);

  setAdminContributions(formatted);
  setPendingContributions(
    formatted.filter((item) => item.status === "pending")
  );
} 
async function signInAdmin(email, password) {
  const now = Date.now();

  if (adminLockUntil && now < adminLockUntil) {
    const minutesLeft = Math.ceil((adminLockUntil - now) / 60000);
    setAdminMessage(
      `Trop de tentatives de connexion. Réessayez dans ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`
    );
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const nextAttempts = adminLoginAttempts + 1;
    setAdminLoginAttempts(nextAttempts);

    if (nextAttempts >= 3) {
      setAdminLockUntil(Date.now() + 15 * 60 * 1000);
      setAdminMessage(
        "Trop de tentatives incorrectes. L’accès administrateur est temporairement bloqué pendant 15 minutes."
      );
      return;
    }

    setAdminMessage(
      `Connexion impossible. Tentative ${nextAttempts}/3 avant blocage temporaire.`
    );
    return;
  }

  setAdminLoginAttempts(0);
  setAdminLockUntil(null);
  setAdminMessage("Connexion administrateur réussie.");
}

  async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error(error);
    setAdminMessage("La déconnexion administrateur n’a pas pu être effectuée.");
    return;
  }

  setSession(null);
  setAdminContributions([]);
  setPendingContributions([]);
  setAdminMessage("Déconnexion administrateur effectuée.");
}

async function moderateContribution(id, newStatus, reason = "", note = "") {
  const updatePayload = {
    status: newStatus,
    updated_at: new Date().toISOString(),
    moderated_at: new Date().toISOString(),
  };

  if (reason) {
    updatePayload.moderation_reason = reason;
  }

  if (note) {
    updatePayload.moderation_note = note;
  }

  const { error } = await supabase
    .from("contributions")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    console.error(error);
    setAdminMessage("La décision de modération n’a pas pu être enregistrée.");
    return;
  }

  await loadPendingContributions();
  await loadPublishedContributions();

  const message =
    newStatus === "published"
      ? "Contribution publiée. Elle apparaît maintenant sur la carte publique."
      : newStatus === "rejected"
        ? `Contribution refusée${reason ? ` — motif : ${reason}` : ""}.`
        : `Contribution archivée${reason ? ` — motif : ${reason}` : ""}.`;

  setAdminMessage(message);
}

async function addContribution(form) {
  const layer =
    form.author === "Enfant accompagné"
      ? "enfants"
      : form.type === "Idée d’aménagement"
        ? "idees"
        : "regards";

  const position = draftPoint || quartierCenter(form.quartier);

  const contribution = {
    title: form.title,
    quartier: form.quartier,
    type: form.type,
    emotion: form.emotion,
    description: form.description,
    layer,
    latitude: position[0],
    longitude: position[1],
    media_url: form.media || null,
    pseudonyme: null,
    contact_email: null,
    status: "pending",
  };

  const { error } = await supabase
    .from("contributions")
    .insert(contribution);

  if (error) {
    console.error(error);
    alert("La contribution n’a pas pu être envoyée. Vérifie la connexion Supabase.");
    return;
  }


  setDraftPoint(null);

  alert("Merci, votre contribution a bien été envoyée. Elle est maintenant en attente de validation.");
  setPage("carte");
}
  
return (
  <main>
    <Header page={page} setPage={setPage} />

    {page === "accueil" && (
      <Home setPage={setPage} zoomQuartier={zoomQuartier} />
    )}

    {page === "carte" && (
      <MapPage
        items={filteredItems}
        selected={selected}
        setSelected={setSelected}
        visibleLayers={visibleLayers}
        toggleLayer={toggleLayer}
        filters={filters}
        setFilters={setFilters}
        zoomQuartier={zoomQuartier}
        zoomTarget={zoomTarget}
        setDraftPoint={setDraftPoint}
        draftPoint={draftPoint}
        setPage={setPage}
      />
    )}

    {page === "ajout" && (
      <ContributionForm
        title="Ajouter un regard habitant"
        intro="Déposez une photo, un souvenir, un lieu aimé ou une idée. Votre contribution sera relue avant publication."
        types={typesHabitants}
        defaultType="Lieu aimé"
        author="Habitant"
        draftPoint={draftPoint}
        setPage={setPage}
        onSubmit={addContribution}
      />
    )}

    {page === "enfants" && (
      <ContributionForm
        childMode
        title="Ville à hauteur d’enfants"
        intro="Déposez un dessin, une phrase ou un poème. La contribution doit être accompagnée par un adulte."
        types={typesEnfants}
        defaultType="Dessin d’enfant"
        author="Enfant accompagné"
        draftPoint={draftPoint}
        setPage={setPage}
        onSubmit={addContribution}
      />
    )}

    {page === "urbanistes" && (
      <Dashboard
        items={allItems}
        filteredItems={filteredItems}
        filters={filters}
        setFilters={setFilters}
        zoomQuartier={zoomQuartier}
        session={session}
        pendingContributions={pendingContributions}
        adminContributions={adminContributions}
        adminMessage={adminMessage}
        setAdminMessage={setAdminMessage}
        signInAdmin={signInAdmin}
        signOutAdmin={signOutAdmin}
        loadPendingContributions={loadPendingContributions}
        moderateContribution={moderateContribution}
      />
    )}

    {page === "protection" && <Protection />}
    {passwordRecoveryOpen && (
  <div className="modalOverlay" role="dialog" aria-modal="true">
    <div className="rulesModal">
      <div className="modalHeader">
        <div>
          <p className="eyebrow">Réinitialisation administrateur</p>
          <h2>Choisir un nouveau mot de passe</h2>
        </div>

        <button
          className="modalClose"
          type="button"
          onClick={() => setPasswordRecoveryOpen(false)}
          aria-label="Fermer la fenêtre"
        >
          ×
        </button>
      </div>

      <div className="rulesContent compactRules">
        <section>
          <h3>Nouveau mot de passe</h3>

          <label className="field">
            <span>Nouveau mot de passe</span>
            <input
              type="password"
              value={newAdminPassword}
              onChange={(event) => setNewAdminPassword(event.target.value)}
              placeholder="8 caractères minimum"
            />
          </label>

          <label className="field">
            <span>Confirmer le mot de passe</span>
            <input
              type="password"
              value={confirmAdminPassword}
              onChange={(event) => setConfirmAdminPassword(event.target.value)}
              placeholder="Répéter le nouveau mot de passe"
            />
          </label>
        </section>

        {passwordRecoveryMessage && (
          <div className="legalNote">
            {passwordRecoveryMessage}
          </div>
        )}
      </div>

      <div className="modalActions">
        <button
          className="secondary"
          type="button"
          onClick={() => setPasswordRecoveryOpen(false)}
        >
          Annuler
        </button>

        <button
          className="primary"
          type="button"
          onClick={updateRecoveredPassword}
        >
          Mettre à jour le mot de passe
        </button>
      </div>
    </div>
  </div>
)}
  </main>
);
}

function Header({ page, setPage }) {       
  const links = [
  ["accueil", "Accueil"],
  ["carte", "Carte"],
  ["ajout", "Ajouter"],
  ["enfants", "Enfants"],
  ["protection", "Protection"],
];

  return (
    <header className="topbar">
      <button className="brand" onClick={() => setPage("accueil")}>
        <span className="brandIcon">📍</span>
        <span>
          <strong>Lomme à hauteur d’habitants</strong>
          <small>Carte sensible · quartiers · vie locale</small>
        </span>
      </button>
      <nav aria-label="Navigation principale">
        {links.map(([key, label]) => (
          <button key={key} className={page === key ? "navButton active" : "navButton"} onClick={() => setPage(key)}>
            {label}
          </button>
        ))}
      </nav>
      <button
  className={page === "urbanistes" ? "internalLink active" : "internalLink"}
  onClick={() => setPage("urbanistes")}
>
  Espace urbanistes
</button>
    </header>
  );
}

function Home({ setPage, zoomQuartier }) {
  return (
    <section className="page homePage">
      <div className="homeHero">
        <div className="heroText">
          <p className="eyebrow">Cartographie sensible et participative</p>

          <h1>Lomme à hauteur d’habitants</h1>

          <p className="lead">
            Une carte pour raconter les lieux vécus, les usages du quotidien,
            les idées d’aménagement et la vie locale de Lomme.
          </p>

          <div className="heroActions">
            <button className="primary" onClick={() => setPage("carte")}>
              Explorer la carte
            </button>
            <button className="secondary" onClick={() => setPage("ajout")}>
              Ajouter un regard
            </button>
            <button className="secondary" 
            type="button"
            onClick={() => setRulesOpen(true)}
             style={{ marginTop: "10px" }}
>
              Consulter les règles de contribution
            </button>
          </div>

          <div className="trustBadge">
            <strong>Contribution protégée</strong>
            <span>
              Chaque contribution est volontaire, relue avant publication et
              utilisée pour mieux comprendre les besoins du territoire.
            </span>
          </div>
        </div>

        <div className="heroPhotoCard">
          <img
            src="/assets/lomme-accueil.jpeg"
            alt="Vue urbaine de Lomme"
            className="heroPhoto"
          />
          <div className="photoCaption">
            <span>📍 Lomme</span>
            <strong>Regarder la ville par ses usages</strong>
          </div>
        </div>
      </div>

      <div className="homeSteps">
        <article className="stepCard">
          <span>1</span>
          <h2>Contribuer</h2>
          <p>Un habitant partage un lieu aimé, un souvenir, un besoin ou une idée.</p>
        </article>

        <article className="stepCard">
          <span>2</span>
          <h2>Relire</h2>
          <p>La contribution est vérifiée avant publication pour protéger les personnes.</p>
        </article>

        <article className="stepCard">
          <span>3</span>
          <h2>Comprendre</h2>
          <p>Les regards publiés nourrissent une lecture sensible du territoire.</p>
        </article>
      </div>

      <div className="homeGrid">
        <ActionCard
          icon="🗺️"
          title="Explorer les quartiers"
          text="Parcourir Bourg, Délivrance, Marais, Mitterie et Mont-à-Camp."
          onClick={() => setPage("carte")}
        />
        <ActionCard
          icon="🎨"
          title="Ville à hauteur d’enfants"
          text="Accueillir dessins, phrases, poèmes et ressentis accompagnés."
          onClick={() => setPage("enfants")}
        />
        <ActionCard
          icon="🤝"
          title="Vie locale"
          text="Valoriser les associations, événements, ateliers et lieux ressources."
          onClick={() => setPage("carte")}
        />
        <ActionCard
          icon="🏘️"
          title="Zoomer sur un quartier"
          text="Entrer directement dans une lecture de proximité."
          onClick={() => zoomQuartier("Bourg")}
        />
      </div>
    </section>
  );
}

function ActionCard({ icon, title, text, onClick }) {
  return (
    <button className="actionCard" onClick={onClick}>
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </button>
  );
}

function MapPage({
  items,
  selected,
  setSelected,
  visibleLayers,
  toggleLayer,
  filters,
  setFilters,
  zoomQuartier,
  zoomTarget,
  draftPoint,
  setDraftPoint,
  setPage,
}) {
  const mapRef = useRef(null);

  return (
    <section className="page mapPage">
      <div className="mapHeader">
        <div>
          <p className="eyebrow">Carte interactive de Lomme</p>
          <h1>Explorer par quartier et par couche</h1>
          <p className="intro">Choisissez un quartier, activez les couches utiles, puis cliquez sur un point pour lire la fiche.</p>
        </div>
        <button className="primary" onClick={() => setPage("ajout")}>Ajouter un regard</button>
      </div>

      <div className="toolsPanel">
        <div className="toolBlock">
          <strong>Zoom par quartier</strong>
          <div className="chips">
            {["Toute la ville", ...quartiers].map((q) => (
              <button key={q} className={filters.quartier === q || (q === "Toute la ville" && filters.quartier === "Tous") ? "chip active" : "chip"} onClick={() => zoomQuartier(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="toolBlock">
          <strong>Couches</strong>
          <div className="chips">
            {Object.keys(layerLabels).map((layer) => (
              <button key={layer} className={visibleLayers[layer] ? "chip layer active" : "chip layer"} onClick={() => toggleLayer(layer)}>
                {visibleLayers[layer] ? "☑" : "☐"} {layerLabels[layer]}
              </button>
            ))}
          </div>
        </div>

        <div className="toolBlock filtersLine">
          <Select label="Ressenti" value={filters.emotion} options={["Tous", ...emotions]} onChange={(value) => setFilters((f) => ({ ...f, emotion: value }))} />
          <label className="field searchField">
            <span>Recherche</span>
            <input value={filters.query} onChange={(event) => setFilters((f) => ({ ...f, query: event.target.value }))} placeholder="ex. école, arbres, culture..." />
          </label>
        </div>
      </div>

      <div className="leafletLayout">
        <div className="mapShell">
          <MapContainer ref={mapRef} center={lommeCenter} zoom={13} minZoom={12} maxZoom={18} scrollWheelZoom className="leafletMap">
            <ZoomToBounds targetBounds={zoomTarget} />
            <MapClickCapture onMapClick={setDraftPoint} />
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Carte claire — OpenStreetMap">
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Vue aérienne — Esri World Imagery">
                <TileLayer
                  attribution="Tiles &copy; Esri"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              </LayersControl.BaseLayer>
              <LayersControl.Overlay name="Carte sensible fournie" checked>
                <ImageOverlay url="/assets/carte-lomme.jpg" bounds={lommeBounds} opacity={0.38} />
              </LayersControl.Overlay>
                <LayersControl.Overlay name="Zones de zoom provisoires">
  <GeoJSON
    data={quartiersGeoJson}
    style={() => ({
      color: "#6f8f72",
      weight: 2,
      fillColor: "#6f8f72",
      fillOpacity: 0.08,
    })}
    onEachFeature={(feature, layer) =>
      layer.bindTooltip(feature.properties.quartier, { sticky: true })
    }
  />
</LayersControl.Overlay>
              {melmapWmsLayers.filter((layer) => layer.enabled && layer.url && layer.layers).map((layer) => (
                <LayersControl.BaseLayer key={layer.id} name={layer.name}>
                  <WMSTileLayer
                    url={layer.url}
                    layers={layer.layers}
                    format={layer.format || "image/png"}
                    transparent={layer.transparent ?? true}
                    attribution={layer.attribution}
                  />
                </LayersControl.BaseLayer>
              ))}
            </LayersControl>

            {items.map((item) => (
              <Marker key={item.id} position={item.position} icon={makeIcon(item)} eventHandlers={{ click: () => setSelected(item) }}>
                <Popup>
                  <strong>{item.title}</strong>
                  <br />
                  {item.quartier} · {item.type}
                </Popup>
              </Marker>
            ))}

            {draftPoint && (
              <Marker position={draftPoint} icon={L.divIcon({ html: "<span>➕</span>", className: "custom-pin custom-pin-draft", iconSize: [42, 42], iconAnchor: [21, 42] })}>
                <Popup>
                  <strong>Nouveau point choisi</strong>
                  <br />
                  Vous pouvez maintenant ajouter une contribution.
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        <aside className="sidePanel">
          <SelectedCard selected={selected} setPage={setPage} />
          <div className="notice">
            Cliquez sur la carte pour choisir l’emplacement d’une prochaine contribution.
            {draftPoint && <><br /><strong>Point choisi :</strong> {draftPoint[0].toFixed(5)}, {draftPoint[1].toFixed(5)}</>}
          </div>
        </aside>
      </div>
    </section>
  );
}

function SelectedCard({ selected, setPage }) {
  if (!selected) {
    return <section className="sideCard"><p>Sélectionnez un marqueur sur la carte.</p></section>;
  }

  if (selected.layer === "vie-locale") {
    return (
      <section className="sideCard">
        <div className="mediaBox">{typeIcon[selected.type] || "🤝"} Vie locale</div>
        <p className="tag">Vie locale · {selected.category || selected.type}</p>
        <h2>{selected.title}</h2>
        <p className="meta"><strong>Quartier :</strong> {selected.quartier}</p>
        <p><strong>Lieu :</strong> {selected.place}</p>
        <p><strong>Moment :</strong> {selected.date || selected.schedule || "À compléter"}</p>
        <p>{selected.description}</p>
        <p className="sourceLine">Source : {selected.source}</p>
        <button className="secondary full" onClick={() => setPage("ajout")}>Raconter mon expérience de ce lieu</button>
      </section>
    );
  }

  return (
    <section className="sideCard">
      <div className="mediaBox">{selected.media}</div>
      <p className="tag">{layerLabels[selected.layer] || selected.type}</p>
      <h2>{selected.title}</h2>
      <p className="meta">{selected.quartier} · {emotionIcon[selected.emotion]} {selected.emotion}</p>
      <p>{selected.description}</p>
      <div className="notice compact validationNotice">
       Contribution relue avant publication.
      </div>
    </section>
  );
}

function ContributionForm({ childMode = false, title, intro, types, defaultType, author, draftPoint, setPage, onSubmit }) {
  const [form, setForm] = useState({
    title: "",
    quartier: "Bourg",
    type: defaultType,
    emotion: childMode ? "joie" : "calme",
    description: "",
    author,
    media: childMode ? "🎨 Dessin simulé" : "📷 Image simulée",
  });

const [acceptedRules, setAcceptedRules] = useState(false);
const [rulesOpen, setRulesOpen] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
  event.preventDefault();

  if (!form.title.trim() || !form.description.trim()) {
    alert("Merci d’ajouter un titre et quelques mots.");
    return;
  }

  if (!acceptedRules) {
    alert("Merci de confirmer que vous avez lu les règles de contribution avant l’envoi.");
    return;
  }

  onSubmit(form);
}

  return (
    <section className={childMode ? "page formPage children" : "page formPage"}>
      <div className="formIntro">
        <p className="eyebrow">{childMode ? "Atelier accompagné" : "Contribution habitante"}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
        <button className="secondary" onClick={() => setPage("carte")}>Choisir un point sur la carte</button>
        <div className="notice compact">
          {draftPoint ? `Point choisi : ${draftPoint[0].toFixed(5)}, ${draftPoint[1].toFixed(5)}` : "Aucun point précis choisi : la contribution sera placée au centre du quartier sélectionné."}
        </div>
      </div>

      <form className="cardForm" onSubmit={submit}>
        {childMode && (
          <div className="emotionChoices" aria-label="Choix du ressenti">
            {emotions.map((emotion) => (
              <button type="button" key={emotion} className={form.emotion === emotion ? "emotion active" : "emotion"} onClick={() => update("emotion", emotion)}>
                <span>{emotionIcon[emotion]}</span>
                {emotion}
              </button>
            ))}
          </div>
        )}

        <label className="field">
          <span>Titre</span>
          <input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder={childMode ? "Exemple : Ma rue idéale" : "Exemple : Une rue trop sombre"} />
        </label>

        <div className="formGrid">
          <Select label="Quartier" value={form.quartier} options={quartiers} onChange={(value) => update("quartier", value)} />
          <Select label="Type" value={form.type} options={types} onChange={(value) => update("type", value)} />
          {!childMode && <Select label="Ressenti" value={form.emotion} options={emotions} onChange={(value) => update("emotion", value)} />}
        </div>

        <label className="field">
          <span>{childMode ? "Quelques mots de l’enfant" : "Description courte"}</span>
          <textarea rows="5" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder={childMode ? "Exemple : Je voudrais plus d’arbres près de l’école." : "Expliquez simplement ce que vous voyez, ressentez ou proposez."} />
        </label>

        <label className="uploadBox">
          <span>{childMode ? "🎨 Dépôt de dessin simulé" : "📎 Dépôt d’image simulé"}</span>
          <input type="file" onChange={(event) => {
            const fileName = event.target.files?.[0]?.name;
            update("media", fileName ? `${childMode ? "🎨" : "📷"} ${fileName}` : form.media);
          }} />
          <small>{childMode ? "Pour les enfants, privilégier les dessins plutôt que les photos de visages." : "Dans cette V3, le fichier est seulement affiché par son nom."}</small>
        </label>

        <div className="notice">
  Les contributions sont modérées avant publication. Les enfants restent anonymes.
</div>

<label
  className="notice compact"
  style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}
>
  <input
    type="checkbox"
    checked={acceptedRules}
    onChange={(event) => setAcceptedRules(event.target.checked)}
    style={{ marginTop: "4px" }}
  />
  <span>
    J’ai lu les règles de contribution et j’accepte que ma contribution soit relue
    avant publication. Je m’engage à ne pas transmettre de données personnelles,
    d’accusation nominative ou de photo sensible.
    <br />
    <button
      className="secondary"
      type="button"
      onClick={() => setRulesOpen(true)}
      style={{ marginTop: "10px" }}
    >
      Consulter les règles de contribution
    </button>
  </span>
</label>

{rulesOpen && (
  <div className="modalOverlay" role="dialog" aria-modal="true">
    <div className="rulesModal">
      <div className="modalHeader">
        <div>
          <p className="eyebrow">Règles de contribution</p>
          <h2>Contribuer en protégeant les personnes</h2>
        </div>

        <button
          className="modalClose"
          type="button"
          onClick={() => setRulesOpen(false)}
          aria-label="Fermer la fenêtre"
        >
          ×
        </button>
      </div>

      <div className="rulesContent compactRules">
  <section>
    <h3>Contribution attendue</h3>
    <p>
      Vous pouvez partager un lieu aimé, un souvenir, une idée d’aménagement,
      un ressenti ou une observation sur un espace public de Lomme.
    </p>
  </section>

  <section>
    <h3>Protection des personnes</h3>
    <p>
      Merci de ne pas transmettre de nom, prénom, adresse précise, numéro de
      téléphone, plaque d’immatriculation, visage reconnaissable ou information
      permettant d’identifier une personne directement ou indirectement.
    </p>
  </section>

  <section>
    <h3>Photos et droit à l’image</h3>
    <p>
      Privilégiez les photos de lieux, de rues, d’ambiances ou de détails
      urbains. Les photos de personnes reconnaissables, et particulièrement
      d’enfants, seront écartées lors de la modération.
    </p>
  </section>

  <section>
    <h3>Propos sensibles</h3>
    <p>
      Les accusations nominatives, insinuations visant une personne identifiable,
      propos injurieux ou discriminatoires ne sont pas publiés. Cette règle
      protège les habitants, les agents, les associations et les contributeurs.
    </p>
  </section>

  {childMode && (
    <section>
      <h3>Contribution d’enfant</h3>
      <p>
        Les dessins, phrases et poèmes sont privilégiés. L’enfant reste anonyme
        et la contribution doit être accompagnée par un adulte.
      </p>
    </section>
  )}

  <div className="legalNote">
    Rappel : les contributions sont relues avant publication afin de respecter
    le RGPD, le droit à l’image, la vie privée et les règles relatives aux propos
    diffamatoires ou discriminatoires.
  </div>
</div>

      <div className="modalActions">
        <button
          className="secondary"
          type="button"
          onClick={() => setRulesOpen(false)}
        >
          Fermer
        </button>

        <button
          className="primary"
          type="button"
          onClick={() => {
            setAcceptedRules(true);
            setRulesOpen(false);
          }}
        >
          J’ai compris et j’accepte
        </button>
      </div>
    </div>
  </div>
)}

<button className="primary full" type="submit" disabled={!acceptedRules}>
  Envoyer la contribution
</button>
      </form>
    </section>
  );
}

function Dashboard({
  items,
  filteredItems,
  filters,
  setFilters,
  zoomQuartier,
  session,
  pendingContributions,
  adminContributions,
  adminMessage,
  setAdminMessage,
  signInAdmin,
  signOutAdmin,
  loadPendingContributions,
  moderateContribution,
}) {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeStatus, setActiveStatus] = useState("pending");
  const [moderationDecision, setModerationDecision] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [accessProfiles, setAccessProfiles] = useState([]);

  useEffect(() => {
  if (!session?.user?.id) {
    setUserProfile(null);
    return;
  }

  async function loadUserProfile() {
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, role, status")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setUserProfile(null);
      return;
    }

    setUserProfile(data);
  }

  loadUserProfile();
}, [session]);

  const activeRole = userProfile?.status === "active" ? userProfile.role : null;

const canManageAccess = ["gestionnaire", "admin"].includes(activeRole);

const canModerate = ["gestionnaire", "admin", "moderateur"].includes(activeRole);

const canExport = ["gestionnaire", "admin", "urbaniste"].includes(activeRole);

const canViewDiagnostic = [
  "gestionnaire",
  "admin",
  "urbaniste",
  "moderateur",
  "lecteur_interne",
].includes(activeRole);

  useEffect(() => {
  if (!canManageAccess) {
    setAccessProfiles([]);
    return;
  }

  async function loadAccessProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, role, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setAccessProfiles(data || []);
  }

  loadAccessProfiles();
}, [canManageAccess]);

  const statusTabs = [
    { key: "pending", label: "En attente", helper: "À relire avant publication" },
    { key: "published", label: "Publiées", helper: "Visibles sur la carte publique" },
    { key: "rejected", label: "Refusées", helper: "Conservées côté modération" },
    { key: "archived", label: "Archivées", helper: "Retirées de l’affichage public" },
  ];

  const safeAdminContributions = adminContributions || [];

  const moderationCounts = {
    pending: safeAdminContributions.filter((item) => item.status === "pending").length,
    published: safeAdminContributions.filter((item) => item.status === "published").length,
    rejected: safeAdminContributions.filter((item) => item.status === "rejected").length,
    archived: safeAdminContributions.filter((item) => item.status === "archived").length,
  };

  const activeAdminItems = safeAdminContributions.filter((item) => item.status === activeStatus);
  const activeStatusLabel =
  statusTabs.find((tab) => tab.key === activeStatus)?.label || "sélection";

function countBy(rows, getLabel) {
  const countsMap = rows.reduce((acc, item) => {
    const label = getLabel(item) || "Non renseigné";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(countsMap)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

const diagnosticRows = activeAdminItems;
const diagnosticTotal = diagnosticRows.length;

const quartierStats = countBy(diagnosticRows, (item) => item.quartier).slice(0, 5);
const emotionStats = countBy(diagnosticRows, (item) => item.emotion).slice(0, 5);
const typeStats = countBy(diagnosticRows, (item) => item.type).slice(0, 5);
const layerStats = countBy(
  diagnosticRows,
  (item) => layerLabels[item.layer] || item.layer
).slice(0, 5);

const recentDiagnosticRows = diagnosticRows.slice(0, 6);

const diagnosticSummary =
  diagnosticTotal === 0
    ? [
        "Aucune contribution dans cet onglet pour le moment.",
        "L’aperçu diagnostic s’actualisera dès que des contributions seront disponibles.",
      ]
    : [
        `L’onglet ${activeStatusLabel.toLowerCase()} rassemble ${diagnosticTotal} contribution${diagnosticTotal > 1 ? "s" : ""}.`,
        quartierStats[0]
          ? `Le quartier le plus représenté est ${quartierStats[0].label} avec ${quartierStats[0].count} contribution${quartierStats[0].count > 1 ? "s" : ""}.`
          : "Les quartiers restent à consolider.",
        emotionStats[0]
          ? `Le ressenti dominant est ${emotionStats[0].label}.`
          : "Les ressentis restent à compléter.",
        typeStats[0]
          ? `Le type de contribution le plus fréquent est ${typeStats[0].label}.`
          : "Les types de contributions restent à préciser.",
      ];
 
  const counts = {
    total: items.length,
    regards: items.filter((i) => i.layer === "regards").length,
    enfants: items.filter((i) => i.layer === "enfants").length,
    vie: items.filter((i) => i.layer === "vie-locale").length,
    idees: items.filter((i) => i.layer === "idees").length,
  };

  const byQuartier = quartiers
    .map((quartier) => ({
      quartier,
      count: items.filter((item) => item.quartier === quartier).length,
    }))
    .sort((a, b) => b.count - a.count);

  async function handleAdminLogin(event) {
    event.preventDefault();
    setLoginLoading(true);
    await signInAdmin(adminEmail, adminPassword);
    setLoginLoading(false);
  }

  async function handlePasswordReset() {
  if (!adminEmail.trim()) {
    alert("Indiquez votre adresse e-mail avant de demander un nouveau mot de passe.");
    return;
  }

  setLoginLoading(true);

  const { error } = await supabase.auth.resetPasswordForEmail(adminEmail, {
    redirectTo: window.location.origin,
  });

  setLoginLoading(false);

  if (error) {
    console.error(error);
    alert("La demande de réinitialisation n’a pas pu être envoyée.");
    return;
  }

  alert("Si ce compte est autorisé, un lien de réinitialisation vient d’être envoyé.");
}

if (!session) {
  return (
    <section className="page urbanLoginPage">
      <div className="loginShell">
        <div>
          <p className="eyebrow">Espace interne</p>
          <h1>Espace urbanistes</h1>
          <p className="intro">
            Accès réservé aux personnes autorisées. Les contributions en attente,
            les exports, les notes internes et les autorisations sont visibles
            uniquement après connexion.
          </p>
        </div>

        <form className="cardForm loginCard" onSubmit={handleAdminLogin}>
          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              placeholder="adresse e-mail autorisée"
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>Mot de passe</span>
            <input
              type="password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              placeholder="mot de passe"
              autoComplete="current-password"
            />
          </label>

          {adminMessage && <div className="notice compact">{adminMessage}</div>}

          <button className="primary full" type="submit" disabled={loginLoading}>
            {loginLoading ? "Connexion..." : "Se connecter"}
          </button>

          <button
            className="secondary full"
            type="button"
            onClick={handlePasswordReset}
            disabled={loginLoading}
          >
            Mot de passe oublié
          </button>

          <div className="notice compact validationNotice">
            L’accès est réservé aux comptes autorisés par l’administrateur du projet.
          </div>
        </form>
      </div>
    </section>
  );
}

 async function handlePasswordReset() {
  const email = adminEmail.trim();

  if (!email) {
    setAdminMessage("Indique d’abord l’e-mail administrateur à réinitialiser.");
    return;
  }

  setAdminMessage("Demande de réinitialisation en cours...");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });

  if (error) {
    console.error(error);
    setAdminMessage(`Erreur Supabase : ${error.message}`);
    return;
  }

  setAdminMessage(
    "Si ce compte existe, un lien de réinitialisation a été envoyé par e-mail."
  );
}

  function exportContributionsCsv(rows, label = "diagnostic") {
  if (!rows || rows.length === 0) {
    alert("Aucune contribution à exporter dans cette sélection.");
    return;
  }

  const headers = [
    "date_depot",
    "quartier",
    "couche",
    "type",
    "ressenti",
    "statut",
    "titre",
    "description",
    "latitude",
    "longitude",
  ];

  const escapeCsv = (value) => {
    const text = String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();

    return `"${text.replace(/"/g, '""')}"`;
  };

  const lines = rows.map((item) => {
    const latitude = Array.isArray(item.position) ? item.position[0] : "";
    const longitude = Array.isArray(item.position) ? item.position[1] : "";

    return [
      item.created_at ? new Date(item.created_at).toLocaleDateString("fr-FR") : "",
      item.quartier,
      layerLabels[item.layer] || item.layer,
      item.type,
      item.emotion,
      item.status,
      item.title,
      item.description,
      latitude,
      longitude,
    ].map(escapeCsv).join(";");
  });

  const csv = `\ufeff${headers.join(";")}\n${lines.join("\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `diagnostic-lomme-${label}-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

  function exportContributionsCsv(rows, label = "diagnostic") {
  if (!rows || rows.length === 0) {
    alert("Aucune contribution à exporter dans cette sélection.");
    return;
  }

  const headers = [
    "date_depot",
    "quartier",
    "couche",
    "type",
    "ressenti",
    "statut",
    "titre",
    "description",
    "latitude",
    "longitude",
  ];

  const escapeCsv = (value) => {
    const text = String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();

    return `"${text.replace(/"/g, '""')}"`;
  };

  const lines = rows.map((item) => {
    const latitude = Array.isArray(item.position) ? item.position[0] : "";
    const longitude = Array.isArray(item.position) ? item.position[1] : "";

    return [
      item.created_at ? new Date(item.created_at).toLocaleDateString("fr-FR") : "",
      item.quartier,
      layerLabels[item.layer] || item.layer,
      item.type,
      item.emotion,
      item.status,
      item.title,
      item.description,
      latitude,
      longitude,
    ].map(escapeCsv).join(";");
  });

  const csv = `\ufeff${headers.join(";")}\n${lines.join("\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `diagnostic-lomme-${label}-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

  return (
    <section className="page">
      <p className="eyebrow">Espace urbanistes</p>
      <h1>Atelier diagnostic et modération</h1>
      <p className="intro">
        Cet espace aide à croiser paroles habitantes, regards d’enfants, vie locale,
        idées d’aménagement et décisions de modération.
      </p>

      <div className="stats">
        <Stat number={counts.total} label="points sur la carte" />
        <Stat number={counts.regards} label="regards habitants" />
        <Stat number={counts.enfants} label="regards d’enfants" />
        <Stat number={counts.vie} label="points de vie locale" />
        <Stat number={counts.idees} label="idées pour demain" />
      </div>

      <section className="panel adminModerationPanel">
        <div className="adminPanelHeader">
          <div>
            <h2>Atelier de modération</h2>
            <p>
              Les contributions sont relues avant publication. La décision reste humaine :
              publier, refuser ou archiver.
            </p>
          </div>

          {session && (
            <button className="secondary" onClick={loadPendingContributions}>
              Actualiser
            </button>
          )}
        </div>

        {!session ? (
          <form className="cardForm" onSubmit={handleAdminLogin}>
            <label className="field">
              <span>E-mail administrateur</span>
              <input
                type="email"
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                placeholder="votre adresse admin"
              />
            </label>

            <label className="field">
              <span>Mot de passe</span>
              <input
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                placeholder="mot de passe Supabase"
              />
            </label>

            {adminMessage && <div className="notice compact">{adminMessage}</div>}

            <button className="primary full" type="submit" disabled={loginLoading}>
              {loginLoading ? "Connexion..." : "Se connecter comme administrateur"}
            </button>

            <button
  className="secondary full"
  type="button"
  onClick={async () => {
    const email = adminEmail.trim();

    if (!email) {
      setAdminMessage("Indique d’abord l’e-mail administrateur à réinitialiser.");
      return;
    }

    setAdminMessage("Demande de réinitialisation en cours...");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (error) {
      console.error(error);
    }

    setAdminMessage(
      "Si ce compte existe, un lien de réinitialisation a été envoyé par e-mail."
    );
  }}
>
  Mot de passe oublié ?
</button>

          </form>
        ) : (
          <>
            <div className="toolsPanel urbanTools">
              <button className="secondary" onClick={signOutAdmin}>
                Se déconnecter
              </button>
            </div>

            {adminMessage && <div className="notice compact">{adminMessage}</div>}

            <div className="statusTabs">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={activeStatus === tab.key ? "statusTab active" : "statusTab"}
                  onClick={() => setActiveStatus(tab.key)}
                >
                  <strong>{tab.label}</strong>
                  <span>{moderationCounts[tab.key]}</span>
                  <small>{tab.helper}</small>
                </button>
              ))}
            </div>
            {canManageAccess ? (
  <AuthorizationsPanel profiles={accessProfiles} />
) : (
  <div className="notice compact">
    La gestion des accès internes est réservée au gestionnaire ou à l’administrateur du projet.
  </div>
)}

            {activeAdminItems.length === 0 ? (
              <div className="notice compact">
                Aucun contenu dans cet onglet pour le moment.
              </div>
            ) : (
              <section className="list adminList">
                {activeAdminItems.map((item) => (
                  <article className="listItem adminItem" key={item.id}>
                    <span>{typeIcon[item.type] || "📍"}</span>

                    <div>
                      <div className="adminItemHeader">
                        <strong>{item.title}</strong>
                        <em>{item.status}</em>
                      </div>

                      <p>
                        {item.quartier} · {layerLabels[item.layer] || item.type}
                        {item.emotion ? ` · ${emotionIcon[item.emotion]} ${item.emotion}` : ""}
                      </p>

                      <p>{item.description}</p>

                      <p className="meta">
                        Déposé le :{" "}
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString("fr-FR")
                          : "date inconnue"}
                      </p>

                      <div className="toolsPanel urbanTools">
                        
                        {canModerate && item.status !== "published" && (
  <button
    className="primary"
    onClick={() => moderateContribution(item.id, "published")}
  >
    {item.status === "pending" ? "Publier" : "Republier"}
  </button>
)}

{canModerate && item.status !== "rejected" && item.status !== "published" && (
  <button
    className="secondary"
    onClick={() => openModerationModal(item, "rejected")}
  >
    Refuser
  </button>
)}

{canModerate && item.status === "published" && (
  <button
    className="secondary"
    onClick={() => openModerationModal(item, "archived")}
  >
    Retirer de la carte / Archiver
  </button>
)}

{canModerate && item.status !== "archived" && item.status !== "published" && (
  <button
    className="secondary"
    onClick={() => openModerationModal(item, "archived")}
  >
    Archiver
  </button>
)}

                        <button
                          className="secondary"
                          onClick={() => zoomQuartier(item.quartier)}
                        >
                          Voir le quartier
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </section>

{moderationDecision && (
  <div className="modalOverlay" role="dialog" aria-modal="true">
    <div className="rulesModal">
      <div className="modalHeader">
        <div>
          <p className="eyebrow">Décision de modération</p>
          <h2>
            {moderationDecision.status === "rejected"
              ? "Motif de refus"
              : "Motif d’archivage"}
          </h2>
        </div>

        <button
          className="modalClose"
          type="button"
          onClick={() => setModerationDecision(null)}
          aria-label="Fermer la fenêtre"
        >
          ×
        </button>
      </div>

      <div className="rulesContent compactRules">
        <section>
          <h3>Contribution concernée</h3>
          <p>{moderationDecision.title}</p>
        </section>

        <section>
          <label className="field">
            <span>Motif obligatoire</span>
            <select
              value={moderationReason}
              onChange={(event) => setModerationReason(event.target.value)}
            >
              <option value="">Sélectionner un motif</option>
              {moderationReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Note interne facultative</span>
            <textarea
              rows="3"
              value={moderationNote}
              onChange={(event) => setModerationNote(event.target.value)}
              placeholder="Précision utile pour l’équipe de modération."
            />
          </label>
        </section>

        <div className="legalNote">
          Cette décision reste interne à l’espace Urbanistes. Elle permet de
          conserver une trace claire du refus ou de l’archivage.
        </div>
      </div>

      <div className="modalActions">
        <button
          className="secondary"
          type="button"
          onClick={() => setModerationDecision(null)}
        >
          Annuler
        </button>

        <button
          className="primary"
          type="button"
          onClick={confirmModerationDecision}
          disabled={!moderationReason}
        >
          Confirmer la décision
        </button>
      </div>
    </div>
  </div>
)}

      <div className="toolsPanel urbanTools">
  <Select
    label="Quartier"
    value={filters.quartier}
    options={["Tous", ...quartiers]}
    onChange={(value) => setFilters((f) => ({ ...f, quartier: value }))}
  />

  <Select
    label="Ressenti"
    value={filters.emotion}
    options={["Tous", ...emotions]}
    onChange={(value) => setFilters((f) => ({ ...f, emotion: value }))}
  />

  {canExport && (
    <>
      <button
        className="secondary"
        onClick={() => exportContributionsCsv(activeAdminItems, activeStatus)}
      >
        Exporter CSV de l’onglet
      </button>

      <button
        className="secondary"
        onClick={() =>
          exportContributionsCsv(
            safeAdminContributions.filter((item) => item.status === "published"),
            "publiees"
          )
        }
      >
        Exporter CSV publiées
      </button>
    </>
  )}
</div>

<section className="panel diagnosticPreviewPanel">
  <div className="diagnosticPreviewHeader">
    <div>
      <h2>Aperçu diagnostic</h2>
      <p>
        Lecture rapide de l’onglet “{activeStatusLabel}”. Cet aperçu aide à
        comprendre les tendances avant export CSV ou futur export PDF.
      </p>
    </div>

    <div className="diagnosticBadge">
      <strong>{diagnosticTotal}</strong>
      <span>contribution{diagnosticTotal > 1 ? "s" : ""}</span>
    </div>
  </div>

  <div className="diagnosticSummary">
    <h3>Lecture rapide</h3>
    {diagnosticSummary.map((sentence) => (
      <p key={sentence}>{sentence}</p>
    ))}
  </div>

  <div className="diagnosticColumns">
    <DiagnosticMiniList title="Par quartier" rows={quartierStats} />
    <DiagnosticMiniList title="Par ressenti" rows={emotionStats} />
    <DiagnosticMiniList title="Par type" rows={typeStats} />
    <DiagnosticMiniList title="Par couche" rows={layerStats} />
  </div>

  <div className="diagnosticTableWrap">
    <h3>Dernières contributions de l’onglet</h3>

    {recentDiagnosticRows.length === 0 ? (
      <div className="notice compact">
        Aucune contribution à afficher dans cet aperçu.
      </div>
    ) : (
      <table className="diagnosticTable">
        <thead>
          <tr>
            <th>Date</th>
            <th>Quartier</th>
            <th>Type</th>
            <th>Ressenti</th>
            <th>Titre</th>
          </tr>
        </thead>
        <tbody>
          {recentDiagnosticRows.map((item) => (
            <tr key={item.id}>
              <td>
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString("fr-FR")
                  : "—"}
              </td>
              <td>{item.quartier || "—"}</td>
              <td>{item.type || "—"}</td>
              <td>{item.emotion || "—"}</td>
              <td>{item.title || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
</section>

      <div className="dashboardGrid">
        <section className="panel">
          <h2>Quartiers les plus mentionnés</h2>
          {byQuartier.map((item) => (
            <div className="barRow" key={item.quartier}>
              <button onClick={() => zoomQuartier(item.quartier)}>
                {item.quartier}
              </button>
              <div className="bar">
                <div style={{ width: `${Math.max(12, item.count * 18)}%` }} />
              </div>
              <strong>{item.count}</strong>
            </div>
          ))}
        </section>

        <section className="panel">
          <h2>Synthèse sensible</h2>
          <p>
            Les points de vie locale permettent de repérer les lieux de rencontre,
            d’activité associative, d’événements et d’animation du territoire.
          </p>
          <p>
            Les contributions habitantes et enfantines permettent de relier ces lieux
            aux accès, à l’ambiance, à l’éclairage, aux cheminements et aux besoins
            d’aménagement.
          </p>
        </section>
      </div>

      <section className="list">
        <h2>Points filtrés</h2>
        {filteredItems.map((item) => (
          <article className="listItem" key={item.id}>
            <span>{typeIcon[item.type] || "📍"}</span>
            <div>
              <strong>{item.title}</strong>
              <p>
                {item.quartier} · {layerLabels[item.layer] || item.type}
                {item.emotion ? ` · ${emotionIcon[item.emotion]} ${item.emotion}` : ""}
              </p>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}

function AuthorizationsPanel({ profiles = [] }) {
  return (
    <section className="accessPanel">
      <div className="accessHeader">
        <div>
          <p className="eyebrow">Accès interne</p>
          <h2>Gestion des accès internes</h2>
          <p>
            Cette rubrique est destinée au gestionnaire des accès. Elle permet de
            suivre les comptes autorisés à utiliser l’espace urbanistes : identité,
            adresse e-mail, rôle, niveau d’accès et statut du compte.
          </p>
        </div>

        <span className="accessBadge">Réservé gestionnaire</span>
      </div>

      <div className="accessMetrics">
        <article>
          <strong>Comptes</strong>
          <span>Nom, prénom, e-mail</span>
        </article>

        <article>
          <strong>Rôles</strong>
          <span>Gestionnaire · admin · urbaniste · modérateur</span>
        </article>

        <article>
          <strong>Traçabilité</strong>
          <span>Décisions, accès et exports internes</span>
        </article>
      </div>

      <div className="accessTableWrap">
        <table className="accessTable">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th>Statut</th>
            </tr>
          </thead>

          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={3}>Aucun profil interne à afficher pour le moment.</td>
              </tr>
            ) : (
              profiles.map((profile) => {
                const fullName =
                  `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
                  "Nom à compléter";

                return (
                  <tr key={profile.id}>
                    <td>
                      <strong>{fullName}</strong>
                      <br />
                      <span className="tableSubtext">{profile.email}</span>
                    </td>
                    <td>{profile.role}</td>
                    <td>
                      <span className="statusPill">{profile.status}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="accessNote">
        Cette gestion des accès est réservée au gestionnaire ou à l’administrateur du projet.
      </p>
    </section>
  );
}

function DiagnosticMiniList({ title, rows }) {
  return (
    <article className="diagnosticMiniList">
      <h3>{title}</h3>

      {rows.length === 0 ? (
        <p>Aucune donnée.</p>
      ) : (
        rows.map((row) => (
          <div className="diagnosticMiniRow" key={row.label}>
            <span>{row.label}</span>
            <strong>{row.count}</strong>
          </div>
        ))
      )}
    </article>
  );
}


function Protection() {
  const documents = [
  {
    icon: "🛡️",
    title: "Politique de confidentialité",
    text: "Ce document explique quelles données peuvent être collectées, pourquoi elles sont utilisées, comment elles sont protégées et comment exercer ses droits.",
    href: "/assets/documents/politique-confidentialite.pdf",
  },
  {
    icon: "🤝",
    title: "Charte d’usage et de modération",
    text: "Cette charte précise les règles de contribution, les contenus refusés, la protection des mineurs, le droit à l’image et le rôle de la modération humaine.",
    href: "/assets/documents/charte-usage-moderation.pdf",
  },
  {
    icon: "🧠",
    title: "Charte d’usage de l’intelligence artificielle",
    text: "Cette charte encadre l’usage éventuel de l’IA : elle peut aider à classer, reformuler ou synthétiser, mais la décision finale reste humaine.",
    href: "/assets/documents/charte-ia.pdf",
  },
];
const [openDoc, setOpenDoc] = useState(null);
  return (
    <section className="page protection">
      <p className="eyebrow">Cadre de confiance</p>
      <h1>Protection des habitants, des enfants et des données</h1>

      <p className="intro">
        Cette application repose sur une règle simple : les contributions sont volontaires,
        modérées avant publication et utilisées pour mieux comprendre les lieux vécus,
        les besoins du quotidien et la vie locale.
      </p>

      <div className="protectionGrid">
        <article>
          <span>✅</span>
          <h2>Modération humaine</h2>
          <p>
            Les contributions sont relues avant publication. Une contribution peut être
            publiée, reformulée, refusée ou archivée si elle contient des informations sensibles.
          </p>
        </article>

        <article>
          <span>🧒</span>
          <h2>Protection des enfants</h2>
          <p>
            Les contributions d’enfants sont accompagnées par un adulte. Les dessins,
            phrases et poèmes anonymisés sont privilégiés.
          </p>
        </article>

        <article>
          <span>📷</span>
          <h2>Droit à l’image</h2>
          <p>
            Les photos de lieux et d’espaces publics sont privilégiées. Les photos de
            personnes reconnaissables, en particulier d’enfants, font l’objet d’une vigilance renforcée.
          </p>
        </article>

        <article>
          <span>🌿</span>
          <h2>Cadre de vie</h2>
          <p>
            Les données servent à nourrir un diagnostic urbain sensible, à valoriser la vie locale
            et à appuyer l’amélioration du cadre de vie.
          </p>
        </article>
      </div>

      <section className="panel">
        <h2>Documents de référence</h2>
        <p>
          Ces documents constituent le socle de confiance de l’application. Ils sont à compléter
          et à faire relire par un juriste, un DPO ou une collectivité avant un usage officiel.
        </p>

        <div className="dashboardGrid">
          {documents.map((doc) => (
            <article className="listItem" key={doc.href}>
              <span>{doc.icon}</span>
              <div>
                <strong>{doc.title}</strong>
                <p>{doc.text}</p>
                <div className="toolsPanel urbanTools">
                  <button
  className="secondary"
  type="button"
  onClick={() => setOpenDoc(doc)}
>
  Lire dans l’application
</button>

<a className="primary" href={doc.href} download>
  Télécharger
</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
{openDoc && (
  <section className="panel">
    <div className="toolsPanel urbanTools">
      <div>
        <h2>{openDoc.title}</h2>
        <p>Lecture intégrée du document.</p>
      </div>

      <button className="secondary" type="button" onClick={() => setOpenDoc(null)}>
        Fermer la lecture
      </button>
    </div>

    <iframe
      title={openDoc.title}
      src={openDoc.href}
      style={{
        width: "100%",
        height: "720px",
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: "18px",
        background: "white",
      }}
    />

    <div className="toolsPanel urbanTools">
      <a className="secondary" href={openDoc.href} target="_blank" rel="noopener noreferrer">
        Ouvrir dans un onglet
      </a>
      <a className="primary" href={openDoc.href} download>
        Télécharger le PDF
      </a>
    </div>
  </section>
)}
      <section className="panel">
        <h2>Avant d’envoyer une contribution</h2>
        <p>
          Votre contribution est volontaire. Elle peut contenir un titre, un quartier,
          un ressenti, une localisation choisie et une description courte.
        </p>
        <p>
          Elle sera relue avant publication. Elle peut être anonymisée, reformulée,
          refusée ou archivée si elle contient des données personnelles, une accusation
          nominative, une photo sensible ou un contenu contraire à la charte.
        </p>
        <p>
          Évitez les noms complets, les adresses personnelles, les photos de personnes
          reconnaissables et les informations concernant des mineurs.
        </p>
      </section>
    </section>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="field small">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Stat({ number, label }) {
  return <article className="stat"><strong>{number}</strong><span>{label}</span></article>;
}

function quartierCenter(quartier) {
  const bounds = quartiersBounds[quartier] || quartiersBounds["Toute la ville"];
  const [[south, west], [north, east]] = bounds;
  return [(south + north) / 2, (west + east) / 2];
}
