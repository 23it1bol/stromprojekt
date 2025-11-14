/**
 * devices.ts - Routen für Zähler/Geräte-Management
 * 
 * Stellt REST-Endpoints für CRUD-Operationen auf Zählern bereit:
 * - GET    /api/devices     - Alle Zähler auflisten
 * - GET    /api/devices/:id - Einzelnen Zähler abrufen
 * - POST   /api/devices     - Neuen Zähler erstellen
 * - PUT    /api/devices/:id - Zähler aktualisieren
 * - DELETE /api/devices/:id - Zähler löschen
 * 
 * Alle Routen erfordern Authentifizierung via JWT Token
 */

import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice
} from '../controllers/deviceController';

const router = Router();

// Authentifizierung für alle Zähler-Routen erforderlich
router.use(auth);

// CRUD Operationen für Zähler/Geräte
router.get('/', getAllDevices);
router.get('/:id', getDeviceById);
router.post('/', createDevice);
router.put('/:id', updateDevice);
router.delete('/:id', deleteDevice);

export default router;