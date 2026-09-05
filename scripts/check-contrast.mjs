const pairs = [
  ['texte principal', '#1c2b26', '#fffaf2', 4.5],
  ['texte secondaire', '#52615c', '#fffaf2', 4.5],
  ['bouton principal', '#ffffff', '#315b50', 4.5],
  ['lien principal', '#25473f', '#fffaf2', 4.5],
  ['bordure composant', '#687873', '#fffaf2', 3],
  ['indicateur focus', '#9d3800', '#fffaf2', 3],
];

function channel(value) {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((value) => channel(Number.parseInt(value, 16)));
  if (!channels || channels.length !== 3) throw new Error(`Couleur invalide : ${hex}`);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

const failures = pairs
  .map(([name, foreground, background, minimum]) => ({
    name,
    ratio: contrast(foreground, background),
    minimum,
  }))
  .filter(({ ratio, minimum }) => ratio < minimum);

if (failures.length) {
  for (const failure of failures) {
    console.error(`${failure.name}: ${failure.ratio.toFixed(2)}:1 < ${failure.minimum}:1`);
  }
  process.exit(1);
}

console.log('Contrastes des jetons critiques validés.');
