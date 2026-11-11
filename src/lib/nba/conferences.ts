import type { ConferenceId } from "./types";

/**
 * Conferencia de cada franquicia por su abreviatura. Incluye las de ESPN
 * ("GS", "NO", "NY", "SA", "UTAH", "WSH") y las habituales de la NBA.
 */
const CONFERENCE_BY_ABBREVIATION: Record<string, ConferenceId> = {
  ATL: "east",
  BOS: "east",
  BKN: "east",
  BRK: "east",
  CHA: "east",
  CHI: "east",
  CLE: "east",
  DET: "east",
  IND: "east",
  MIA: "east",
  MIL: "east",
  NY: "east",
  NYK: "east",
  ORL: "east",
  PHI: "east",
  TOR: "east",
  WSH: "east",
  WAS: "east",
  DAL: "west",
  DEN: "west",
  GS: "west",
  GSW: "west",
  HOU: "west",
  LAC: "west",
  LAL: "west",
  MEM: "west",
  MIN: "west",
  NO: "west",
  NOP: "west",
  OKC: "west",
  PHX: "west",
  PHO: "west",
  POR: "west",
  SAC: "west",
  SA: "west",
  SAS: "west",
  UTAH: "west",
  UTA: "west",
};

/** `null` si la abreviatura no es de un equipo NBA conocido. */
export function getTeamConference(abbreviation: string): ConferenceId | null {
  return CONFERENCE_BY_ABBREVIATION[abbreviation.toUpperCase()] ?? null;
}

export const CONFERENCE_NAMES: Record<ConferenceId, string> = {
  east: "Este",
  west: "Oeste",
};
