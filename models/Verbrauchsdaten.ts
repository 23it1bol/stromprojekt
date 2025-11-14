/**
 * Verbrauchsdaten.ts - Modell für Verbrauchs-/Zählerstände
 *
 * Entspricht der DB-Tabelle `Verbrauchsdaten` mit Primärschlüssel
 * (Zaehlernummer, Datum).
 */

export interface Verbrauchsdaten {
  Zaehlernummer: number;
  Datum: string | Date; // YYYY-MM-DD
  Zaehlerstand: number;
}

export default Verbrauchsdaten;
