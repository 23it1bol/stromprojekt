// -----------------------------
// db.ts - MySQL-Datenbankverbindung
// -----------------------------

// mysql2/promise importieren, um Promises/async-await nutzen zu können
import mysql from "mysql2/promise";

// Pool von Verbindungen erstellen
// Vorteil: mehrere gleichzeitige Anfragen möglich, effizienter als einzelne Verbindungen
const pool = mysql.createPool({
  host: "localhost",        // Datenbank-Server (für Windows lokal)
  user: "root",             // MySQL-Benutzername
  password: "", // Passwort für den MySQL-Benutzer
  database: "stromprojekt",   // Name deiner Test-Datenbank
  waitForConnections: true, // Wartet, falls alle Verbindungen belegt sind
  connectionLimit: 10,      // Maximale Anzahl gleichzeitiger Verbindungen
  queueLimit: 0             // Keine Begrenzung für wartende Anfragen
});

// Export des Pools, damit andere Dateien (z.B. index.ts) ihn importieren können
export default pool;
