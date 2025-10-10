// -----------------------------
// index.ts - Hauptdatei des Servers
// -----------------------------

// Express importieren, um Webserver-Funktionalität zu nutzen
import express from "express";

// MySQL-Pool importieren, der die Verbindung zur Datenbank verwaltet
import pool from "./db";

// Express-Anwendung erstellen
const app = express();

// Port festlegen, auf dem der Server später läuft
const port = 3000;

// -----------------------------
// Test-Route für Funktionsprüfung
// -----------------------------
app.get("/test", (req, res) => {
  // Gibt beim Aufruf der URL /test einfach "OK" zurück
  res.send("OK");
});

// -----------------------------
// Route zum Testen der MySQL-Datenbankverbindung
// -----------------------------
app.get("/dbtest", async (req, res) => {
  try {
    // Einfache SQL-Abfrage, um die aktuelle Uhrzeit aus der DB zu holen
    const [rows] = await pool.query("SELECT NOW() AS time");

    // Ergebnis als JSON zurückgeben, zeigt, dass die DB-Verbindung funktioniert
    res.json({ status: "OK", dbTime: rows });
  } catch (err) {
    // Fehlerfall: Server gibt 500 zurück
    console.error("Datenbank-Verbindungsfehler:", err);
    res.status(500).send("DB connection failed");
  }
});

// -----------------------------
// Server starten
// -----------------------------
app.listen(port, () => {
  // Ausgabe in der Konsole, sobald der Server bereit ist
  console.log(`Server läuft auf http://localhost:${port}`);
});
