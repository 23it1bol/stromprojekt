import express from 'express';
import { getAllKunden, createKunde } from '../controllers/kundenController';
import { logAudit } from '../utils/auditLogger';

const router = express.Router(); // Erstellt einen Router für diese Gruppe von Endpunkten

// GET /api/kunden -> alle Kunden zurückgeben
router.get('/', (req, res) => {
  const kunden = getAllKunden(); // Dummy-Funktion, die Kunden zurückgibt
  res.json(kunden); // Antwort an den Client als JSON
});

// POST /api/kunden -> neuen Kunden anlegen
router.post('/', (req, res) => {
  const neuerKunde = createKunde(req.body); // Neuer Kunde aus Request-Body
  logAudit('Kunden', neuerKunde.KundenID, 'INSERT', 'Admin', `Neuer Kunde: ${neuerKunde.Name}`);
  res.json({ success: true, kunde: neuerKunde });
});

export default router; // Exportiert den Router, damit index.ts ihn benutzen kann
