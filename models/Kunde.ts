/**
 * Kunde.ts - Benutzermodell
 * 
 * Definiert die Struktur eines Kunden/Benutzers im System.
 * Interface wird für TypeScript Type-Checking verwendet.
 */

export interface Kunde {
  // Primärschlüssel, optional bei Neuerstellung
  KundenID?: number;

  // Persönliche Daten
  name?: string;      // Name des Kunden
  email?: string;     // E-Mail-Adresse (für Login)
  
  // Sicherheit
  password?: string;  // Gehashtes Passwort - NIE als Klartext speichern!
  role?: string;      // Benutzerrolle (z.B. 'user', 'admin')
  
  // Weitere mögliche Felder
  // telefon?: string;
  // adresse?: string;
  // erstellt_am?: Date;
  // letzter_login?: Date;
}

// Exportiere das Interface als Standard-Export
export default Kunde;
