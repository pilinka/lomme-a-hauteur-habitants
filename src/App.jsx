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

  function addContribution(form) {
    const layer = form.author === "Enfant accompagné" ? "enfants" : form.type === "Idée d’aménagement" ? "idees" : "regards";
    const contribution = {
      id: `new-${Date.now()}`,
      layer,
      title: form.title,
      quartier: form.quartier,
      type: form.type,
      emotion: form.emotion,
      description: form.description,
      author: form.author,
      media: form.media || "📎 Média simulé",
      position: draftPoint || quartierCenter(form.quartier),
      status: "en attente de modération",
    };

    setContributions((current) => [contribution, ...current]);
    setSelected(contribution);
    setDraftPoint(null);
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

      {page === "urbanistes" && <Dashboard items={allItems} filteredItems={filteredItems} filters={filters} setFilters={setFilters} zoomQuartier={zoomQuartier} />}

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

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      alert("Merci d’ajouter un titre et quelques mots.");
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

        <div className="notice">Les contributions sont modérées avant publication. Les enfants restent anonymes.</div>
        <button className="primary full" type="submit">Envoyer la contribution</button>
      </form>
    </section>
  );
}

function Dashboard({ items, filteredItems, filters, setFilters, zoomQuartier }) {
  const counts = {
    total: items.length,
    regards: items.filter((i) => i.layer === "regards").length,
    enfants: items.filter((i) => i.layer === "enfants").length,
    vie: items.filter((i) => i.layer === "vie-locale").length,
    idees: items.filter((i) => i.layer === "idees").length,
  };

  const byQuartier = quartiers
    .map((quartier) => ({ quartier, count: items.filter((item) => item.quartier === quartier).length }))
    .sort((a, b) => b.count - a.count);

  return (
    <section className="page">
      <p className="eyebrow">Espace urbanistes</p>
      <h1>Diagnostic sensible et vie locale</h1>
      <p className="intro">Cet espace aide à croiser paroles habitantes, regards d’enfants, vie locale et idées d’aménagement.</p>

      <div className="stats">
        <Stat number={counts.total} label="points sur la carte" />
        <Stat number={counts.regards} label="regards habitants" />
        <Stat number={counts.enfants} label="regards d’enfants" />
        <Stat number={counts.vie} label="points de vie locale" />
        <Stat number={counts.idees} label="idées pour demain" />
      </div>

      <div className="toolsPanel urbanTools">
        <Select label="Quartier" value={filters.quartier} options={["Tous", ...quartiers]} onChange={(value) => setFilters((f) => ({ ...f, quartier: value }))} />
        <Select label="Ressenti" value={filters.emotion} options={["Tous", ...emotions]} onChange={(value) => setFilters((f) => ({ ...f, emotion: value }))} />
        <button className="secondary" onClick={() => alert("Export fictif du diagnostic sensible")}>Exporter le diagnostic</button>
      </div>

      <div className="dashboardGrid">
        <section className="panel">
          <h2>Quartiers les plus mentionnés</h2>
          {byQuartier.map((item) => (
            <div className="barRow" key={item.quartier}>
              <button onClick={() => zoomQuartier(item.quartier)}>{item.quartier}</button>
              <div className="bar"><div style={{ width: `${Math.max(12, item.count * 18)}%` }} /></div>
              <strong>{item.count}</strong>
            </div>
          ))}
        </section>

        <section className="panel">
          <h2>Synthèse sensible</h2>
          <p>Les points de vie locale permettent de repérer les lieux de rencontre, d’activité associative, d’événements et d’animation du territoire.</p>
          <p>Les contributions habitantes et enfantines permettent de relier ces lieux aux accès, à l’ambiance, à l’éclairage, aux cheminements et aux besoins d’aménagement.</p>
        </section>
      </div>

      <section className="list">
        <h2>Points filtrés</h2>
        {filteredItems.map((item) => (
          <article className="listItem" key={item.id}>
            <span>{typeIcon[item.type] || "📍"}</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.quartier} · {layerLabels[item.layer] || item.type} {item.emotion ? `· ${emotionIcon[item.emotion]} ${item.emotion}` : ""}</p>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}

function Protection() {
  return (
    <section className="page protection">
      <p className="eyebrow">Protection et modération</p>
      <h1>Un cadre simple pour contribuer en confiance</h1>
      <div className="protectionGrid">
        <article><span>✅</span><h2>Modération</h2><p>Les contributions sont relues avant publication pour éviter les contenus sensibles ou nominatifs.</p></article>
        <article><span>🧒</span><h2>Anonymat des enfants</h2><p>Les enfants ne sont pas nommés. Les dessins et textes courts sont privilégiés.</p></article>
        <article><span>📷</span><h2>Images prudentes</h2><p>Les photos de personnes reconnaissables sont évitées ou floutées avant publication.</p></article>
        <article><span>🌿</span><h2>Cadre de vie</h2><p>Les données servent à mieux comprendre les usages, les lieux de rencontre et les besoins d’aménagement.</p></article>
      </div>
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
