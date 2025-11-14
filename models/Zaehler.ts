/**
 * Zaehler.ts - Zähler/Geräte-Modell
 * 
 * Definiert die Struktur eines Zählers/Messgeräts im System.
 * Interface wird für TypeScript Type-Checking verwendet.
 */

export interface Zaehler {
  // Primärschlüssel in DB: Zaehlernummer (INT)
  Zaehlernummer: number;

  // Installationsdatum (DATE)
  Installationsdatum?: string | Date;

  // Fremdschlüssel zum Kunden
  KundenID?: number;
}

export default Zaehler;
