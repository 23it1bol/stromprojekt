/**
 * deviceController.ts - Controller für Zähler/Geräte-Management
 * 
 * Implementiert die Geschäftslogik für alle Zähler-bezogenen Operationen:
 * - Auflisten aller Zähler
 * - Einzelne Zähler abrufen
 * - Neue Zähler erstellen
 * - Zähler aktualisieren
 * - Zähler löschen
 * 
 * Jede Funktion:
 * - Validiert Eingaben
 * - Führt Datenbankoperationen durch
 * - Behandelt Fehler
 * - Sendet passende HTTP-Antworten
 */

import { Request, Response } from 'express';
import pool from '../src/db';
import { Zaehler } from '../models/Zaehler';

/**
 * Alle Zähler aus der Datenbank abrufen
 * 
 * @param req - Express Request
 * @param res - Express Response
 * 
 * @returns Liste aller Zähler
 * HTTP Status:
 * - 200: Erfolgreich
 * - 500: Serverfehler
 */
export const getAllDevices = async (req: Request, res: Response) => {
  try {
    const [devices] = await pool.query('SELECT * FROM zaehler');
    res.json(devices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Einen Zähler abrufen
export const getDeviceById = async (req: Request, res: Response) => {
  try {
    const [devices] = await pool.query(
      'SELECT * FROM zaehler WHERE id = ?',
      [req.params.id]
    );

    if ((devices as any[]).length === 0) {
      return res.status(404).json({ message: 'Zähler nicht gefunden' });
    }

    res.json((devices as any[])[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Neuen Zähler erstellen
export const createDevice = async (req: Request, res: Response) => {
  try {
    const { bezeichnung, typ, standort } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO zaehler (bezeichnung, typ, standort) VALUES (?, ?, ?)',
      [bezeichnung, typ, standort]
    );

    res.status(201).json({
      id: (result as any).insertId,
      bezeichnung,
      typ,
      standort
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Zähler aktualisieren
export const updateDevice = async (req: Request, res: Response) => {
  try {
    const { bezeichnung, typ, standort } = req.body;
    
    const [result] = await pool.query(
      'UPDATE zaehler SET bezeichnung = ?, typ = ?, standort = ? WHERE id = ?',
      [bezeichnung, typ, standort, req.params.id]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'Zähler nicht gefunden' });
    }

    res.json({ message: 'Zähler erfolgreich aktualisiert' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Zähler löschen
export const deleteDevice = async (req: Request, res: Response) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM zaehler WHERE id = ?',
      [req.params.id]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'Zähler nicht gefunden' });
    }

    res.json({ message: 'Zähler erfolgreich gelöscht' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};