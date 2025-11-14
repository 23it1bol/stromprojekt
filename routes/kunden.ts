import express from 'express';
import { getAllKunden, createKunde, getKundeById, updateKunde } from '../controllers/kundenController';
import { logAudit } from '../utils/auditLogger';
import { auth } from '../middleware/auth';

const router = express.Router(); // Erstellt einen Router für diese Gruppe von Endpunkten

// Alle Kunden-Endpunkte benötigen Authentifizierung
router.use(auth);

// GET /api/kunden -> alle Kunden zurückgeben
router.get('/', async (req, res) => {
  try {
    const kunden = await getAllKunden();
    res.json(kunden);
  } catch (err) {
    console.error('Fehler beim Laden der Kunden:', err);
    res.status(500).json({ error: 'Fehler beim Laden der Kunden' });
  }
});

// POST /api/kunden -> neuen Kunden anlegen
router.post('/', async (req, res) => {
  try {
    // req.user ist durch `auth` gesetzt
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

// GET /api/kunden/:id -> einzelnen Kunden abrufen
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Ungültige ID' });
    const kunde = await getKundeById(id);
    if (!kunde) return res.status(404).json({ error: 'Kunde nicht gefunden' });
    res.json(kunde);
  } catch (err) {
    console.error('Fehler beim Laden des Kunden:', err);
    res.status(500).json({ error: 'Fehler beim Laden des Kunden' });
  }
});

// PUT /api/kunden/:id -> bestehenden Kunden (teilweise) aktualisieren
router.put('/:id?', async (req, res) => {
  try {
    // Erlaube ID via Pfad, Body oder Querystring (in dieser Priorität)
    let id: number | undefined = undefined;

    // Hilfsfunktion: setze id, wenn gültig
    const setIfValid = (val: any) => {
      const n = Number(val);
      if (!isNaN(n) && n > 0) id = n;
    };

    // 1) Pfadparameter
    if (req.params && req.params.id) {
      setIfValid(req.params.id);
    }

    // 2) Request-Body
    if ((!id || id === 0) && req.body) {
      const bid = req.body.KundenID || req.body.kundenID || req.body.kundenId;
      if (bid !== undefined) setIfValid(bid);
    }

    // 3) Querystring ?id=123
    if ((!id || id === 0) && req.query && (req.query.id || req.query.KundenID)) {
      setIfValid(req.query.id || req.query.KundenID);
    }

    if (!id || isNaN(id)) return res.status(400).json({ error: 'Ungültige oder fehlende ID' });

    // Entferne jegliche ID-Felder aus der Payload, damit sie nicht überschrieben werden
    if (req.body) {
      delete req.body.KundenID;
      delete req.body.kundenID;
      delete req.body.kundenId;
      delete req.body.id;
    }

    const aktualisiert = await updateKunde(id, req.body);
    if (!aktualisiert) return res.status(404).json({ error: 'Kunde nicht gefunden oder Update fehlgeschlagen' });

    const userIdent = (req as any).user?.email || String((req as any).user?.id) || 'system';
    logAudit('Kunden', id, 'UPDATE', userIdent, `Kunde aktualisiert: ${aktualisiert.name || id}`);

    res.json({ success: true, kunde: aktualisiert });
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Kunden:', err);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Kunden' });
  }
});

export default router; // Exportiert den Router, damit index.ts ihn benutzen kann
