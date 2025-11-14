import express from 'express';
import { getAllKunden, createKunde } from '../controllers/kundenController';
import { logAudit } from '../utils/auditLogger';
// Temporär auskommentiert: Auth/Role-Check wird später wieder aktiviert
// import { auth } from '../middleware/auth';

const router = express.Router(); // Erstellt einen Router für diese Gruppe von Endpunkten

// GET /api/kunden -> alle Kunden zurückgeben
// Temporär ohne Auth, damit Einrichtung/Tests möglich sind. Wieder aktivieren: füge `auth` als Middleware hinzu.
router.get('/', async (req, res) => {
  try {
    // Hinweis: Role-Check vorübergehend deaktiviert (für Setup). Entfernen/aktivieren wenn gewünscht.
    const kunden = await getAllKunden();
    res.json(kunden);
  } catch (err) {
    console.error('Fehler beim Laden der Kunden:', err);
    res.status(500).json({ error: 'Fehler beim Laden der Kunden' });
  }
});

// POST /api/kunden -> neuen Kunden anlegen
// Temporär ohne Auth (für Setup). Wieder aktivieren: füge `auth` als Middleware hinzu.
router.post('/', async (req, res) => {
  try {
    // Hinweis: Role-Check vorübergehend deaktiviert (für Setup).
    const neuerKunde = await createKunde(req.body); // Neuer Kunde aus Request-Body
    // Falls req.user nicht gesetzt ist (keine Auth), logge 'system' als Urheber
    const userIdent = (req as any).user?.email || String((req as any).user?.id) || 'system';
    logAudit('Kunden', neuerKunde.KundenID, 'INSERT', userIdent, `Neuer Kunde: ${neuerKunde.name}`);
    res.json({ success: true, kunde: neuerKunde });
  } catch (err) {
    console.error('Fehler beim Anlegen eines Kunden:', err);
    res.status(500).json({ error: 'Fehler beim Anlegen eines Kunden' });
  }
});

export default router; // Exportiert den Router, damit index.ts ihn benutzen kann
