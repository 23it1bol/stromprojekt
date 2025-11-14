import { Kunde } from '../models/Kunde';
import pool from '../src/db';


/**
 * Liefert alle Kunden aus der Datenbank.
 * Bei Verbindungsfehlern wird ein Fehler geworfen, der vom Route‑Handler behandelt wird.
 */
export async function getAllKunden(): Promise<Kunde[]> {
  try {
    const [rows] = await pool.query('SELECT * FROM Kunden');
    return (rows as any[]).map(r => ({
      KundenID: r.KundenID,
      name: r.Vorname ? (r.Vorname + (r.Nachname ? ' ' + r.Nachname : '')) : undefined,
    } as Kunde));
  } catch (err) {
    console.error('Fehler beim Laden der Kunden (DB nicht erreichbar):', err);
    throw err;
  }
}

/**
 * Einzelnen Kunden nach ID abrufen
 *
 * @param id Pfadparameter `:id` entspricht `KundenID` in der DB
 */
export async function getKundeById(id: number): Promise<Kunde | null> {
  try {
    const [rows] = await pool.query('SELECT * FROM Kunden WHERE KundenID = ? LIMIT 1', [id]);
    if ((rows as any[]).length === 0) return null;
    const r = (rows as any[])[0];
    const created: Kunde = {
      KundenID: r.KundenID,
      Vorname: r.Vorname,
      Nachname: r.Nachname,
      name: (r.Vorname || '') + (r.Nachname ? ' ' + r.Nachname : ''),
      Straße: r.Straße,
      Hausnummer: r.Hausnummer,
      Mobilnummer: r.Mobilnummer,
      Festnetznummer: r.Festnetznummer
    };
    return created;
  } catch (err) {
    console.warn('DB nicht erreichbar, getKundeById failed:', err);
    return null;
  }
}

/**
 * Legt einen neuen Kunden in der DB an.
 *
 * Unterstützte Input-Felder:
 * - name / vorname / Vorname
 * - nachname / Nachname
 * - straße / strasse / Straße
 * - hausnummer / Hausnummer
 * - mobilnummer / phone
 * - festnetznummer
 * - password (wird gehashed)
 * 
 * Rückgabe: Neue Kunde mit KundenID
 */
export async function createKunde(data: Partial<Kunde> & Record<string, any>): Promise<Kunde> {
  // Hinweis: Kunden-Objekte speichern keine Passwörter hier.
  // Falls Kunden als Login-Benutzer benötigt werden, sollte
  // die Authentifizierung über die separate `users`-Tabelle erfolgen.

  // --- STEP 2: Input-Daten extrahieren und normalisieren ---
  // Unterstütze verschiedene Feldnamen aus dem Request (für Flexibilität)
  const vorname = data.Vorname || data.name || data.vorname || '';
  const nachname = data.Nachname || data.nachname || '';
  const straße = data.Straße || data.straße || data.strasse || null;
  const hausnummer = data.Hausnummer || data.hausnummer || null;
  
  // Kontaktdaten - Großschreibung zuerst (aus DB-Schema)
  const mobilnummer = data.Mobilnummer || data.mobilnummer || data.phone || null;
  const festnetznummer = data.Festnetznummer || data.festnetznummer || null;

  try {
    // --- STEP 3: INSERT in Datenbank ---
    // Füge alle verfügbaren Felder in die Kunden-Tabelle ein
    const [result] = await pool.execute(
      'INSERT INTO Kunden (Vorname, Nachname, Straße, Hausnummer, Mobilnummer, Festnetznummer) VALUES (?, ?, ?, ?, ?, ?)',
      [vorname, nachname, straße, hausnummer, mobilnummer, festnetznummer]
    );

    const insertId = (result as any).insertId as number;
    
    // --- STEP 4: Rückgabe konstruieren ---
    const created: Kunde = {
      KundenID: insertId,
      Vorname: vorname,
      Nachname: nachname,
      name: vorname + (nachname ? ' ' + nachname : ''),
      Straße: straße,
      Hausnummer: hausnummer,
      Mobilnummer: mobilnummer,
      Festnetznummer: festnetznummer,
    };
    return created;
  } catch (err) {
    console.error('Fehler beim Anlegen eines Kunden (DB nicht erreichbar):', err);
    throw err;
  }
}

/**
 * Aktualisiert einen bestehenden Kunden (teilweise oder komplett).
 * Liefert den aktualisierten Kunden zurück oder null wenn nicht gefunden.
 */
export async function updateKunde(id: number, data: Partial<Kunde> & Record<string, any>): Promise<Kunde | null> {
  // Extrahiere mögliche Felder (unterstütze verschiedene Schreibweisen)
  const vorname = data.Vorname || data.name || data.vorname;
  const nachname = data.Nachname || data.nachname;
  const straße = data.Straße || data.straße || data.strasse;
  const hausnummer = data.Hausnummer || data.hausnummer;
  const mobilnummer = data.Mobilnummer || data.mobilnummer || data.phone;
  const festnetznummer = data.Festnetznummer || data.festnetznummer;

  const fields: string[] = [];
  const values: any[] = [];

  if (vorname !== undefined) { fields.push('Vorname = ?'); values.push(vorname); }
  if (nachname !== undefined) { fields.push('Nachname = ?'); values.push(nachname); }
  if (straße !== undefined) { fields.push('Straße = ?'); values.push(straße); }
  if (hausnummer !== undefined) { fields.push('Hausnummer = ?'); values.push(hausnummer); }
  if (mobilnummer !== undefined) { fields.push('Mobilnummer = ?'); values.push(mobilnummer); }
  if (festnetznummer !== undefined) { fields.push('Festnetznummer = ?'); values.push(festnetznummer); }

  if (fields.length === 0) {
    // Nichts zu aktualisieren
    return getKundeById(id);
  }

  try {
    const sql = `UPDATE Kunden SET ${fields.join(', ')} WHERE KundenID = ?`;
    values.push(id);
    const [result] = await pool.execute(sql, values);
    const affected = (result as any).affectedRows as number;
    if (affected === 0) return null;
    return await getKundeById(id);
  } catch (err) {
    console.warn('DB nicht erreichbar oder Update fehlgeschlagen in updateKunde:', err);
    return null;
  }
}
