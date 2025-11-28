import express, { Request, Response } from 'express';
// Hinweis: In manchen Dev-Setups sind die Multer-Typen nicht installiert.
// Wir verwenden daher `require` und unterdrücken die TS-Prüfung an dieser Stelle.
// @ts-ignore
const multer = require('multer');
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { importKundendatenFromRows, importVerbrauchsdatenFromRows } from '../scripts/importerShared';
import { auth } from '../middleware/auth';

const router = express.Router();

// Temporäres Upload-Verzeichnis für Multer (wird nach Verarbeitung bereinigt)
const tmpDir = path.join(process.cwd(), 'tmp_uploads');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
const upload = multer({ dest: tmpDir });

// POST /api/import?type=kundendaten  with form-data file field 'file'
router.post('/', auth, upload.single('file'), async (req: any, res: Response) => {
  try {
    // Only operators/admins allowed to import
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'operator')) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen (erwarte field name "file")' });
    }

    const importType = (req.query.type as string) || req.body.type || 'kundendaten';
    const filePath = req.file.path;
    // Lese die Excel-Datei; cellDates=true sorgt dafür, dass Datumszellen als JS Date zurückgegeben werden
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = xlsx.utils.sheet_to_json(sheet, { defval: null });

    let result: string[] = [];
    if (['kundendaten', 'kunden'].includes(importType.toLowerCase())) {
      result = await importKundendatenFromRows(rows, { auditUser: req.user.email });
    } else if (['verbrauchsdaten', 'verbrauch'].includes(importType.toLowerCase())) {
      result = await importVerbrauchsdatenFromRows(rows);
    } else {
      return res.status(400).json({ error: 'Unbekannter Import-Typ' });
    }

    // Lösche die temporäre Upload-Datei
    try { fs.unlinkSync(filePath); } catch (e) { /* Fehler beim Löschen ignorieren */ }

    res.json({ success: true, imported: result.length, messages: result });
  } catch (err) {
    console.error('Web-Import Fehler:', err);
    res.status(500).json({ error: 'Import fehlgeschlagen', detail: String(err) });
  }
});

export default router;
