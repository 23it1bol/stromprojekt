import { Kunde } from '../models/Kunde';
import bcrypt from 'bcryptjs';
import pool from '../src/db';

// Fallback In-Memory Storage (wenn DB nicht verfügbar)
const fallbackKunden: Kunde[] = [];
let fallbackNextId = 1;

/**
 * Liefert alle Kunden aus der Datenbank, oder aus dem Fallback-Array wenn DB nicht erreichbar ist.
 */
export async function getAllKunden(): Promise<Kunde[]> {
  try {
    const [rows] = await pool.query('SELECT * FROM Kunden');
    return (rows as any[]).map(r => ({
      KundenID: r.KundenID,
      name: r.Vorname ? (r.Vorname + (r.Nachname ? ' ' + r.Nachname : '')) : undefined,
    } as Kunde));
  } catch (err) {
    console.warn('DB nicht erreichbar, verwende In-Memory-Fallback für getAllKunden:', err);
    return fallbackKunden.slice(); // Kopie zurückgeben
  }
}

/**
 * Legt einen neuen Kunden in der DB an (oder im Fallback-Array wenn DB fehlt).
 */
export async function createKunde(data: Partial<Kunde> & Record<string, any>): Promise<Kunde> {
  // Hash des Passworts, falls vorhanden
  let hashedPassword: string | undefined = undefined;
  if (data.password) {
    hashedPassword = await bcrypt.hash(data.password as string, 10);
  }

  // Mapping: unterstütze verschiedene Feldnamen aus dem Request
  const vorname = data.name || data.vorname || data.Vorname || '';
  const nachname = data.nachname || data.Nachname || '';
  const straße = data.straße || data.strasse || data.Straße || null;
  const hausnummer = data.hausnummer || data.Hausnummer || null;
  const mobilnummer = data.mobilnummer || data.phone || null;
  const festnetz = data.festnetznummer || null;

  try {
    const [result] = await pool.execute(
      'INSERT INTO Kunden (Vorname, Nachname, Straße, Hausnummer, Mobilnummer, Festnetznummer) VALUES (?, ?, ?, ?, ?, ?)',
      [vorname, nachname, straße, hausnummer, mobilnummer, festnetz]
    );

    const insertId = (result as any).insertId as number;
    const created: Kunde = {
      KundenID: insertId,
      name: vorname + (nachname ? ' ' + nachname : ''),
      password: hashedPassword,
    };
    return created;
  } catch (err) {
    console.warn('DB nicht erreichbar, lege Kunde im In-Memory-Fallback an:', err);
    const id = fallbackNextId++;
    const created: Kunde = {
      KundenID: id,
      name: vorname + (nachname ? ' ' + nachname : ''),
      password: hashedPassword,
    };
    fallbackKunden.push(created);
    return created;
  }
}
