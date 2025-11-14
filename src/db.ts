// -----------------------------
// db.ts - MySQL-Datenbankverbindung
// -----------------------------

// mysql2/promise importieren, um Promises/async-await nutzen zu können
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Lade Umgebungsvariablen aus einer .env-Datei (lokale Entwicklung)
dotenv.config();

// Pool von Verbindungen erstellen
// Vorteil: mehrere gleichzeitige Anfragen möglich, effizienter als einzelne Verbindungen
// Konfiguration kommt aus Umgebungsvariablen, damit keine Geheimdaten im Quellcode landen
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "", // aus .env oder Umgebungsvariablen
  database: process.env.DB_DATABASE || "stromprojekt",
  waitForConnections: true, // Wartet, falls alle Verbindungen belegt sind
  connectionLimit: 10,      // Maximale Anzahl gleichzeitiger Verbindungen
  queueLimit: 0             // Keine Begrenzung für wartende Anfragen
});

// Export des Pools, damit andere Dateien (z.B. index.ts) ihn importieren können
export default pool;
