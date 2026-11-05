/**
 * Genera todos los iconos de la app a partir de un único diseño.
 * Uso: node scripts/generate-icons.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const BACKGROUND = "#0a0e14";
const BALL = "#f97316";

/**
 * @param {object} options
 * @param {number} options.radius Redondeo del fondo, sobre un lienzo de 512.
 * @param {number} options.scale Tamaño de la pelota respecto del lienzo.
 */
function createIconSvg({ radius, scale }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${radius}" fill="${BACKGROUND}"/>
  <g transform="translate(256 256) scale(${scale})">
    <circle r="170" fill="${BALL}"/>
    <g fill="none" stroke="${BACKGROUND}" stroke-width="14" stroke-linecap="round">
      <path d="M-170 0H170M0-170V170"/>
      <path d="M-120-120C-60-60-60 60-120 120"/>
      <path d="M120-120C60-60 60 60 120 120"/>
    </g>
  </g>
</svg>
`;
}

/** Android solo usa la transparencia del badge: el color no se ve. */
const badgeIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <mask id="seams">
      <rect width="512" height="512" fill="white"/>
      <g transform="translate(256 256) scale(1.4)" fill="none" stroke="black" stroke-width="16" stroke-linecap="round">
        <path d="M-170 0H170M0-170V170"/>
        <path d="M-120-120C-60-60-60 60-120 120"/>
        <path d="M120-120C60-60 60 60 120 120"/>
      </g>
    </mask>
  </defs>
  <circle cx="256" cy="256" r="238" fill="white" mask="url(#seams)"/>
</svg>
`;

const roundedIcon = createIconSvg({ radius: 112, scale: 1.2 });
// Android recorta los iconos "maskable": la pelota debe quedar en la zona segura.
const fullBleedIcon = createIconSvg({ radius: 0, scale: 0.95 });

function writePng(svg, size, path) {
  return sharp(Buffer.from(svg)).resize(size, size).png().toFile(path);
}

await mkdir("public/icons", { recursive: true });
await Promise.all([
  writeFile("src/app/icon.svg", roundedIcon),
  writePng(fullBleedIcon, 180, "src/app/apple-icon.png"),
  writePng(roundedIcon, 192, "public/icons/icon-192.png"),
  writePng(roundedIcon, 512, "public/icons/icon-512.png"),
  writePng(fullBleedIcon, 512, "public/icons/icon-maskable-512.png"),
  writePng(badgeIcon, 96, "public/icons/badge-96.png"),
]);
