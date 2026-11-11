import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

/**
 * GET /api/push/image: imágenes de la notificación de un partido.
 * - `?v=icon&hl=<logo local>&al=<logo visitante>`: los dos escudos (ícono).
 * - `?v=card&...&h=BOS&a=LAL&hs=104&as=108&t=4º Q 02:45`: marcador grande.
 * Solo acepta logos de ESPN, así no sirve para pedir otras direcciones.
 */

const LOGO_PREFIX = "https://a.espncdn.com/i/teamlogos/nba/";
const BACKGROUND = "#0f172a";

function readLogo(params: URLSearchParams, name: string) {
  const value = params.get(name) ?? "";
  return value.startsWith(LOGO_PREFIX) && value.length <= 200 && !value.includes("..")
    ? value
    : null;
}

function readText(params: URLSearchParams, name: string, pattern: RegExp) {
  const value = params.get(name) ?? "";
  return pattern.test(value) ? value : null;
}

const ABBR = /^[A-Za-z]{2,5}$/;
const SCORE = /^\d{1,3}$/;
const TIME = /^[\wºáéíóú ():]{1,24}$/i;

function Logo({ src, size }: { src: string; size: number }) {
  // eslint-disable-next-line @next/next/no-img-element -- Satori necesita <img>.
  return <img src={src} width={size} height={size} alt="" />;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const homeLogo = readLogo(params, "hl");
  const awayLogo = readLogo(params, "al");
  if (!homeLogo || !awayLogo) {
    return Response.json({ error: "Logos inválidos." }, { status: 400 });
  }
  // La URL cambia con cada marcador: cada imagen se puede guardar para siempre.
  const headers = { "Cache-Control": "public, max-age=86400, immutable" };

  if (params.get("v") !== "card") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: BACKGROUND,
            position: "relative",
          }}
        >
          <div style={{ position: "absolute", top: 34, left: 30, display: "flex" }}>
            <Logo src={homeLogo} size={104} />
          </div>
          <div style={{ position: "absolute", bottom: 34, right: 30, display: "flex" }}>
            <Logo src={awayLogo} size={104} />
          </div>
        </div>
      ),
      { width: 256, height: 256, headers },
    );
  }

  const home = readText(params, "h", ABBR);
  const away = readText(params, "a", ABBR);
  const homeScore = readText(params, "hs", SCORE);
  const awayScore = readText(params, "as", SCORE);
  const time = readText(params, "t", TIME);
  if (!home || !away || !homeScore || !awayScore || !time) {
    return Response.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const team = (logo: string, abbr: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 220 }}>
      <Logo src={logo} size={160} />
      <div style={{ fontSize: 40, fontWeight: 700, color: "#cbd5e1", marginTop: 8 }}>
        {abbr.toUpperCase()}
      </div>
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          background: BACKGROUND,
          color: "white",
        }}
      >
        {team(homeLogo, home)}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>
            {`${homeScore} - ${awayScore}`}
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "#fb923c", marginTop: 4 }}>
            {time}
          </div>
        </div>
        {team(awayLogo, away)}
      </div>
    ),
    { width: 900, height: 450, headers },
  );
}
