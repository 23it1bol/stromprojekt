/**
 * logController.ts - Controller für Verbrauchsdaten und System-Logs
 * 
 * Implementiert die Geschäftslogik für Verbrauchsdaten und Logging:
 * - Verbrauchsdaten erfassen und speichern
 * - Historische Daten abrufen
 * - Auswertungen und Statistiken
 * - Systemereignisse protokollieren
 * 
 * Features:
 * - Automatische Zeitstempel
 * - Verknüpfung mit Zählern
 * - Fehlerbehandlung
 * - Datenvalidierung
 */

import { Request, Response } from 'express';
import pool from '../src/db';

/**
 * Alle Logs/Verbrauchsdaten abrufen
 * 
 * @param req - Express Request
 * @param res - Express Response
 * 
 * Funktionen:
 * - Lädt alle Logs mit Zähler-Informationen
 * - Sortiert nach Zeitstempel (neueste zuerst)
 * - Optional: Filterung nach Zeitraum
 */
export const getLogs = async (req: Request, res: Response) => {
  try {
    const [logs] = await pool.query(`
      SELECT l.*, z.bezeichnung as zaehler_bezeichnung 
      FROM verbrauchsdaten l
      JOIN zaehler z ON l.zaehler_id = z.id
      ORDER BY l.zeitstempel DESC
    `);
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Einen Log-Eintrag abrufen
export const getLogById = async (req: Request, res: Response) => {
  try {
    const [logs] = await pool.query(
      `SELECT l.*, z.bezeichnung as zaehler_bezeichnung 
       FROM verbrauchsdaten l
       JOIN zaehler z ON l.zaehler_id = z.id
       WHERE l.id = ?`,
      [req.params.id]
    );

    if ((logs as any[]).length === 0) {
      return res.status(404).json({ message: 'Log nicht gefunden' });
    }

    res.json((logs as any[])[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Neuen Log-Eintrag erstellen
export const createLog = async (req: Request, res: Response) => {
  try {
    const { zaehler_id, wert, zeitstempel } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO verbrauchsdaten (zaehler_id, wert, zeitstempel) VALUES (?, ?, ?)',
      [zaehler_id, wert, zeitstempel || new Date()]
    );

    res.status(201).json({
      id: (result as any).insertId,
      zaehler_id,
      wert,
      zeitstempel: zeitstempel || new Date()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Log-Eintrag aktualisieren
export const updateLog = async (req: Request, res: Response) => {
  try {
    const { wert, zeitstempel } = req.body;
    
    const [result] = await pool.query(
      'UPDATE verbrauchsdaten SET wert = ?, zeitstempel = ? WHERE id = ?',
      [wert, zeitstempel, req.params.id]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'Log nicht gefunden' });
    }

    res.json({ message: 'Log erfolgreich aktualisiert' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Log-Eintrag löschen
export const deleteLog = async (req: Request, res: Response) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM verbrauchsdaten WHERE id = ?',
      [req.params.id]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'Log nicht gefunden' });
    }

    res.json({ message: 'Log erfolgreich gelöscht' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};