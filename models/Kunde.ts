/**
 * Kunde.ts - Benutzermodell
 * 
 * Definiert die Struktur eines Kunden/Benutzers im System.
 * Interface wird für TypeScript Type-Checking verwendet.
 */

export interface Kunde {
  // Primärschlüssel, optional bei Neuerstellung
  KundenID?: number;

  // Persönliche Daten (basierend auf Kunden-Tabelle)
  Vorname?: string;           // Vorname des Kunden
  Nachname?: string;          // Nachname des Kunden
  name?: string;              // Kombinierter Name (Vorname + Nachname)
  email?: string;             // E-Mail-Adresse (für Login)
  
  // Adressdaten
  Straße?: string;            // Straßenname (mit Umlaut aus DB)
  Hausnummer?: string;        // Hausnummer
  
  // Kontaktdaten
  Mobilnummer?: string;       // Mobiltelefonnummer
  Festnetznummer?: string;    // Festnetznummer/Telefon
  
  // Sicherheit
  password?: string;          // Gehashtes Passwort - NIE als Klartext speichern!
  role?: string;              // Benutzerrolle (z.B. 'user', 'admin', 'operator')
  
  // Weitere mögliche Felder
  // erstellt_am?: Date;
  // letzter_login?: Date;
}

// Exportiere das Interface als Standard-Export
export default Kunde;
