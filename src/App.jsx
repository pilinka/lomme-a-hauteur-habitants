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
  const [adminMessage, setAdminMessage] = useState("");
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

  const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
    setSession(currentSession);
  });

  return () => {
    authListener.subscription.unsubscribe();
  };
}, []);
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
async function signInAdmin(email, password) {
  setAdminMessage("");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(error);
    setAdminMessage("Connexion impossible. Vérifie l’e-mail et le mot de passe.");
    return;
  }

  setAdminMessage("Connexion administrateur réussie.");
}

async function signOutAdmin() {
  await supabase.auth.signOut();
  setAdminMessage("Déconnexion effectuée.");
}

async function loadPendingContributions() {
  const { data, error } = await supabase
    .from("contributions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    setAdminMessage("Impossible de charger les contributions en attente.");
    return;
  }

  setPendingContributions((data || []).map(formatContributionFromDb));
}

async function moderateContribution(id, newStatus) {
  const { error } = await supabase
    .from("contributions")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    setAdminMessage("La décision de modération n’a pas pu être enregistrée.");
    return;
  }

  setPendingContributions((current) => current.filter((item) => item.id !== id));

if (newStatus === "published") {
  await loadPublishedContributions();
}

const message =
  newStatus === "published"
    ? "Contribution publiée. Elle apparaît maintenant sur la carte publique."
    : newStatus === "rejected"
      ? "Contribution refusée."
      : "Contribution archivée.";

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

      {page === "accueil" && <Home setPage={setPage} zoomQuartier={zoomQuartier} />}

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
    adminMessage={adminMessage}
    signInAdmin={signInAdmin}
    signOutAdmin={signOutAdmin}
    loadPendingContributions={loadPendingContributions}
    moderateContribution={moderateContribution}
  />
)}

      {page === "protection" && <Protection />}
    </main>
  );
}

function Header({ page, setPage }) {
  const links = [
    ["accueil", "Accueil"],
    ["carte", "Carte"],
    ["ajout", "Ajouter"],
    ["enfants", "Enfants"],
    ["urbanistes", "Urbanistes"],
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
    </header>
  );
}

function Home({ setPage, zoomQuartier }) {
  return (
    <section className="page hero">
      <div className="heroText">
        <p className="eyebrow">Cartographie sensible et participative</p>
        <h1>Lire Lomme à travers les lieux vécus.</h1>
        <p className="lead">
          Une carte simple pour déposer un regard, raconter un lieu, représenter la ville à hauteur d’enfants et situer la vie locale.
        </p>
        <div className="heroActions">
          <button className="primary" onClick={() => setPage("carte")}>Explorer la carte</button>
          <button className="secondary" onClick={() => setPage("ajout")}>Ajouter un regard</button>
        </div>
      </div>

      <div className="homeGrid">
        <ActionCard icon="🗺️" title="Carte Leaflet" text="Fonds de carte, quartiers, marqueurs et couches activables." onClick={() => setPage("carte")} />
        <ActionCard icon="🏘️" title="Zoom par quartier" text="Bourg, Délivrance, Marais, Mitterie et Mont-à-Camp." onClick={() => zoomQuartier("Bourg")} />
        <ActionCard icon="🎨" title="Ville à hauteur d’enfants" text="Dessins, phrases, poèmes et ressentis accompagnés." onClick={() => setPage("enfants")} />
        <ActionCard icon="🤝" title="Vie locale" text="Associations, événements, ateliers, ressources et animations." onClick={() => setPage("carte")} />
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
      <div className="notice"><strong>Statut :</strong> {selected.status}</div>
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
      onClick={() => setPage("protection")}
      style={{ marginTop: "10px" }}
    >
      Lire les règles de protection
    </button>
  </span>
</label>

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
  adminMessage,
  signInAdmin,
  signOutAdmin,
  loadPendingContributions,
  moderateContribution,
}) {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

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

  return (
    <section className="page">
      <p className="eyebrow">Espace urbanistes</p>
      <h1>Diagnostic sensible et modération</h1>
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

      <section className="panel">
        <h2>Contributions en attente de validation</h2>
        <p>
          Les contributions déposées par les habitants arrivent ici avant publication.
          La décision reste humaine : publier, refuser ou archiver.
        </p>

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
          </form>
        ) : (
          <>
            <div className="toolsPanel urbanTools">
              <button className="secondary" onClick={loadPendingContributions}>
                Actualiser les contributions
              </button>
              <button className="secondary" onClick={signOutAdmin}>
                Se déconnecter
              </button>
            </div>

            {adminMessage && <div className="notice compact">{adminMessage}</div>}

            {pendingContributions.length === 0 ? (
              <div className="notice compact">
                Aucune contribution en attente pour le moment.
              </div>
            ) : (
              <section className="list">
                {pendingContributions.map((item) => (
                  <article className="listItem" key={item.id}>
                    <span>{typeIcon[item.type] || "📍"}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>
                        {item.quartier} · {layerLabels[item.layer] || item.type}
                        {item.emotion ? ` · ${emotionIcon[item.emotion]} ${item.emotion}` : ""}
                      </p>
                      <p>{item.description}</p>

                      <div className="toolsPanel urbanTools">
                        <button
                          className="primary"
                          onClick={() => moderateContribution(item.id, "published")}
                        >
                          Publier
                        </button>
                        <button
                          className="secondary"
                          onClick={() => moderateContribution(item.id, "rejected")}
                        >
                          Refuser
                        </button>
                        <button
                          className="secondary"
                          onClick={() => moderateContribution(item.id, "archived")}
                        >
                          Archiver
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
        <button
          className="secondary"
          onClick={() => alert("Export fictif du diagnostic sensible")}
        >
          Exporter le diagnostic
        </button>
      </div>

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
