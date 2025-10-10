// index.ts
import express from 'express'; // Importiere das Express-Framework
import kundenRoutes from './routes/kunden'; // Importiere die Kunden-Routen

const app = express(); // Erstelle eine Express-App (den Server)

// Middleware: Damit Express JSON-Daten aus Requests verstehen kann
app.use(express.json());

// Alle Anfragen an /api/kunden werden an die Kunden-Routen weitergeleitet
app.use('/api/kunden', kundenRoutes);

// Server starten auf Port 3000
app.listen(3000, () => {
  console.log('Server läuft auf http://localhost:3000');
});
