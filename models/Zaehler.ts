/**
 * Zaehler.ts - Zähler/Geräte-Modell
 * 
 * Definiert die Struktur eines Zählers/Messgeräts im System.
 * Interface wird für TypeScript Type-Checking verwendet.
 */

export interface Zaehler {
  // Primärschlüssel
  id?: number;           // Auto-increment ID
  
  // Basis-Informationen
  bezeichnung: string;   // Name/Bezeichnung des Zählers
  typ: string;          // Art des Zählers (z.B. 'Strom', 'Gas', 'Wasser')
  standort: string;     // Wo ist der Zähler installiert?
  
  // Technische Details
  zaehlernummer?: string;  // Seriennummer/eindeutige Kennung
  einheit?: string;        // Messeinheit (z.B. 'kWh', 'm³')
  
  // Verwaltung
  installiert_am?: Date;   // Installationsdatum
  aktiv: boolean;          // Ist der Zähler aktiv?
  letzter_stand?: number;  // Letzter gemessener Stand
  letzte_ablesung?: Date;  // Zeitpunkt der letzten Ablesung
}

export default Zaehler;
