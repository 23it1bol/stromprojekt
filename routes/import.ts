import express, { Request, Response } from 'express';
// multer types might not be installed in the dev environment; use require and ensure tmp dir exists
// @ts-ignore
const multer = require('multer');
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { importKundendatenFromRows, importVerbrauchsdatenFromRows } from '../scripts/importerShared';
import { auth } from '../middleware/auth';

const router = express.Router();

// Multer Temp Storage
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
    const workbook = xlsx.readFile(filePath);
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

    // cleanup temporary file
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

    res.json({ success: true, imported: result.length, messages: result });
  } catch (err) {
    console.error('Web-Import Fehler:', err);
    res.status(500).json({ error: 'Import fehlgeschlagen', detail: String(err) });
  }
});

export default router;
