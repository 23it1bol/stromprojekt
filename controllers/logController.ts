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
    // Liefert alle Verbrauchsdaten mit Zähler- und Kunden-Informationen
    const [logs] = await pool.query(`
      SELECT 
        v.Zaehlernummer,
        v.Datum,
        v.Zaehlerstand,
        z.Installationsdatum,
        z.KundenID,
        k.Vorname,
        k.Nachname
      FROM Verbrauchsdaten v
      LEFT JOIN Zaehler z ON v.Zaehlernummer = z.Zaehlernummer
      LEFT JOIN Kunden k ON z.KundenID = k.KundenID
      ORDER BY v.Datum DESC
    `);
    // Datum-Felder konsistent im Windows-ähnlichen Format tt.mm.yyyy HH.mm.ss zurückgeben
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatDate = (d: any) => {
      if (d === null || d === undefined) return d;
      // Versuche, ein Date-Objekt zu bekommen
      let dt: Date;
      if (d instanceof Date) dt = d;
      else dt = new Date(d);

      if (isNaN(dt.getTime())) {
        // Falls es ein strings wie 'YYYY-MM-DD' ist, formatiere trotzdem
        if (typeof d === 'string' && d.length >= 10) {
          // Unterstütze 'YYYY-MM-DD' oder ISO 'YYYY-MM-DDTHH:MM:SS'
          const datePart = d.split(/[T ]/)[0];
          const parts = datePart.split('-');
          if (parts.length === 3) {
            return `${parts[2]}.${parts[1]}.${parts[0]} 00.00.00`;
          }
        }
        return String(d);
      }

      const day = pad(dt.getDate());
      const month = pad(dt.getMonth() + 1);
      const year = dt.getFullYear();
      const hours = pad(dt.getHours());
      const minutes = pad(dt.getMinutes());
      const seconds = pad(dt.getSeconds());

      // Format mit Punkten als Trenner für Datum und Zeit: 'dd.MM.yyyy HH.mm.ss'
      return `${day}.${month}.${year} ${hours}.${minutes}.${seconds}`;
    };

    const formatted = (logs as any[]).map(r => ({
      ...r,
      Datum: formatDate(r.Datum),
      Installationsdatum: formatDate(r.Installationsdatum),
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Einen Log-Eintrag abrufen
// Einzelnen Log-Eintrag anhand (Zaehlernummer, Datum) abrufen
export const getLogById = async (req: Request, res: Response) => {
  try {
    const zaehlernummer = req.params.zaehlernummer;
    const datum = req.params.datum;

    const [rows] = await pool.query(
      `SELECT v.Zaehlernummer, v.Datum, v.Zaehlerstand, z.KundenID
       FROM Verbrauchsdaten v
       LEFT JOIN Zaehler z ON v.Zaehlernummer = z.Zaehlernummer
       WHERE v.Zaehlernummer = ? AND v.Datum = ?`,
      [zaehlernummer, datum]
    );

    if ((rows as any[]).length === 0) {
      return res.status(404).json({ message: 'Log nicht gefunden' });
    }


    const row = (rows as any[])[0];
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatDate = (d: any) => {
      if (d === null || d === undefined) return d;
      let dt: Date;
      if (d instanceof Date) dt = d;
      else dt = new Date(d);

      if (isNaN(dt.getTime())) {
        if (typeof d === 'string' && d.length >= 10) {
          const datePart = d.split(/[T ]/)[0];
          const parts = datePart.split('-');
          if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]} 00.00.00`;
        }
        return String(d);
      }

      const day = pad(dt.getDate());
      const month = pad(dt.getMonth() + 1);
      const year = dt.getFullYear();
      const hours = pad(dt.getHours());
      const minutes = pad(dt.getMinutes());
      const seconds = pad(dt.getSeconds());

      return `${day}.${month}.${year} ${hours}.${minutes}.${seconds}`;
    };

    const formatted = {
      ...row,
      Datum: formatDate(row.Datum),
      Installationsdatum: formatDate(row.Installationsdatum),
    };

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Neuen Log-Eintrag erstellen
// Neuen Verbrauchsdaten-Eintrag anlegen
export const createLog = async (req: Request, res: Response) => {
  try {
    // Erwarte Felder: Zaehlernummer, Datum (YYYY-MM-DD), Zaehlerstand
    const { Zaehlernummer, Datum, Zaehlerstand } = req.body;

    if (!Zaehlernummer || !Datum || (Zaehlerstand === undefined || Zaehlerstand === null)) {
      return res.status(400).json({ message: 'Erforderliche Felder fehlen: Zaehlernummer, Datum, Zaehlerstand' });
    }

    // INSERT oder UPDATE über ON DUPLICATE KEY (sollte von importer genutzt werden), hier einfacher INSERT
    await pool.query(
      'INSERT INTO Verbrauchsdaten (Zaehlernummer, Datum, Zaehlerstand) VALUES (?, ?, ?)',
      [Zaehlernummer, Datum, Zaehlerstand]
    );

    res.status(201).json({ Zaehlernummer, Datum, Zaehlerstand });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Log-Eintrag aktualisieren
// Verbrauchsdaten aktualisieren (identifiziert durch Zaehlernummer + Datum)
export const updateLog = async (req: Request, res: Response) => {
  try {
    const zaehlernummer = req.params.zaehlernummer;
    const datum = req.params.datum;
    const { Zaehlerstand } = req.body;

    if (Zaehlerstand === undefined || Zaehlerstand === null) {
      return res.status(400).json({ message: 'Kein Zaehlerstand angegeben' });
    }

    const [result] = await pool.query(
      'UPDATE Verbrauchsdaten SET Zaehlerstand = ? WHERE Zaehlernummer = ? AND Datum = ?',
      [Zaehlerstand, zaehlernummer, datum]
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
// Verbrauchsdaten löschen (Zaehlernummer + Datum)
export const deleteLog = async (req: Request, res: Response) => {
  try {
    const zaehlernummer = req.params.zaehlernummer;
    const datum = req.params.datum;

    const [result] = await pool.query(
      'DELETE FROM Verbrauchsdaten WHERE Zaehlernummer = ? AND Datum = ?',
      [zaehlernummer, datum]
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