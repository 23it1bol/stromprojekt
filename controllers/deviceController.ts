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
    const [devices] = await pool.query(
      `SELECT z.Zaehlernummer, z.Installationsdatum, z.KundenID, k.Vorname, k.Nachname
       FROM Zaehler z
       LEFT JOIN Kunden k ON z.KundenID = k.KundenID`
    );
    res.json(devices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Einen Zähler abrufen
export const getDeviceById = async (req: Request, res: Response) => {
  try {
    const zaehlernummer = req.params.zaehlernummer;
    const [rows] = await pool.query(
      `SELECT z.Zaehlernummer, z.Installationsdatum, z.KundenID, k.Vorname, k.Nachname
       FROM Zaehler z
       LEFT JOIN Kunden k ON z.KundenID = k.KundenID
       WHERE z.Zaehlernummer = ?`,
      [zaehlernummer]
    );

    if ((rows as any[]).length === 0) {
      return res.status(404).json({ message: 'Zähler nicht gefunden' });
    }

    res.json((rows as any[])[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Neuen Zähler erstellen
export const createDevice = async (req: Request, res: Response) => {
  try {
    const { Zaehlernummer, Installationsdatum, KundenID } = req.body;

    if (!Zaehlernummer || !Installationsdatum || !KundenID) {
      return res.status(400).json({ message: 'Erforderliche Felder fehlen: Zaehlernummer, Installationsdatum, KundenID' });
    }

    await pool.query(
      'INSERT INTO Zaehler (Zaehlernummer, Installationsdatum, KundenID) VALUES (?, ?, ?)',
      [Zaehlernummer, Installationsdatum, KundenID]
    );

    res.status(201).json({ Zaehlernummer, Installationsdatum, KundenID });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Zähler aktualisieren
export const updateDevice = async (req: Request, res: Response) => {
  try {
    const zaehlernummer = req.params.zaehlernummer;
    const { Installationsdatum, KundenID } = req.body;

    // Baue dynamisches Update
    const fields: string[] = [];
    const params: any[] = [];
    if (Installationsdatum !== undefined) {
      fields.push('Installationsdatum = ?');
      params.push(Installationsdatum);
    }
    if (KundenID !== undefined) {
      fields.push('KundenID = ?');
      params.push(KundenID);
    }
    if (fields.length === 0) {
      return res.status(400).json({ message: 'Keine Felder zum Aktualisieren' });
    }

    params.push(zaehlernummer);
    const query = `UPDATE Zaehler SET ${fields.join(', ')} WHERE Zaehlernummer = ?`;
    const [result] = await pool.query(query, params);

    res.json({ message: 'Zähler erfolgreich aktualisiert', affectedRows: (result as any).affectedRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Zähler löschen
export const deleteDevice = async (req: Request, res: Response) => {
  try {
    const zaehlernummer = req.params.zaehlernummer;
    const [result] = await pool.query('DELETE FROM Zaehler WHERE Zaehlernummer = ?', [zaehlernummer]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'Zähler nicht gefunden' });
    }

    res.json({ message: 'Zähler erfolgreich gelöscht' });
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message.includes('FOREIGN KEY')) {
      return res.status(409).json({ message: 'Zähler kann nicht gelöscht werden, da noch Verbrauchsdaten existieren' });
    }
    res.status(500).json({ message: 'Server Fehler' });
  }
};