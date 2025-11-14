/**
 * logs.ts - Routen für Verbrauchsdaten und System-Logs
 * 
 * Stellt REST-Endpoints für Verbrauchsdaten und Logging bereit:
 * - GET    /api/logs     - Alle Logs/Verbrauchsdaten abrufen
 * - GET    /api/logs/:id - Einzelnen Log-Eintrag abrufen
 * - POST   /api/logs     - Neuen Log-Eintrag erstellen
 * - PUT    /api/logs/:id - Log-Eintrag aktualisieren
 * - DELETE /api/logs/:id - Log-Eintrag löschen
 * 
 * Features:
 * - Automatische Zeitstempel
 * - Verknüpfung mit Zählern via zaehler_id
 * - Filterung nach Zeitraum möglich
 * 
 * Alle Routen erfordern Authentifizierung via JWT Token
 */

import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  getLogs,
  getLogById,
  createLog,
  updateLog,
  deleteLog
} from '../controllers/logController';

const router = Router();

// Authentifizierung für alle Log-Routen erforderlich
router.use(auth);

// CRUD Operationen für Logs/Verbrauchsdaten
router.get('/', getLogs);
router.get('/:id', getLogById);
router.post('/', createLog);
router.put('/:id', updateLog);
router.delete('/:id', deleteLog);

export default router;