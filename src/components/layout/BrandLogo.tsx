import { APP_NAME } from "@/lib/site";

/**
 * Pelota de básquet del tamaño de una "o" minúscula. Toma los colores del
 * tema: relleno de acento y costuras del color de fondo.
 */
function BallLetter() {
  return (
    <svg
      viewBox="-180 -180 360 360"
      aria-hidden
      className="inline-block size-[0.62em] shrink-0"
    >
      <circle r="170" className="fill-accent" />
      <g
        fill="none"
        strokeWidth={22}
        strokeLinecap="round"
        className="stroke-background"
      >
        <path d="M-170 0H170M0-170V170" />
        <path d="M-120-120C-60-60-60 60-120 120" />
        <path d="M120-120C60-60 60 60 120 120" />
      </g>
    </svg>
  );
}

/** Logo de texto: "The R●●kie App", con las "oo" como pelotas. */
export function BrandLogo() {
  return (
    <span
      role="img"
      aria-label={APP_NAME}
      className="flex items-baseline gap-1 text-lg leading-none font-bold tracking-tight"
    >
      <span className="text-xs font-semibold text-muted max-[359px]:hidden">
        The
      </span>
      <span className="flex items-baseline">
        R
        <span className="ml-[0.04em] flex items-baseline gap-[0.03em]">
          <BallLetter />
          <BallLetter />
        </span>
        kie
      </span>
      <span className="text-accent">App</span>
    </span>
  );
}
