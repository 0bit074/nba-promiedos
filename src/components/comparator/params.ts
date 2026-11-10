export type ComparatorType = "jugadores" | "equipos";

export type ComparatorSide = "a" | "b";

export interface ComparatorParams {
  type: ComparatorType;
  a: string | null;
  b: string | null;
}

/** Los ids de ESPN son numéricos; lo demás se ignora. */
function readId(value: unknown) {
  return typeof value === "string" && /^\d{1,12}$/.test(value) ? value : null;
}

export function readComparatorParams(
  params: Record<string, string | string[] | undefined>,
): ComparatorParams {
  return {
    type: params.tipo === "equipos" ? "equipos" : "jugadores",
    a: readId(params.a),
    b: readId(params.b),
  };
}

/** URL del comparador con un lado cambiado (o vacío, con `null`). */
export function getComparatorHref(
  { type, a, b }: ComparatorParams,
  side: ComparatorSide,
  id: string | null,
) {
  const next = { a, b, [side]: id };
  const params = new URLSearchParams({ tipo: type });
  if (next.a) params.set("a", next.a);
  if (next.b) params.set("b", next.b);
  return `/comparador?${params}`;
}

/** Colores de cada lado: el A usa el acento de la app; el B, `rival`. */
export const SIDE_STYLES: Record<
  ComparatorSide,
  { label: string; dotClass: string; barClass: string; textClass: string }
> = {
  a: {
    label: "A",
    dotClass: "bg-accent",
    barClass: "bg-accent",
    textClass: "text-accent",
  },
  b: {
    label: "B",
    dotClass: "bg-rival",
    barClass: "bg-rival",
    textClass: "text-rival",
  },
};
