/**
 * scripts/importExcel.ts
 *
 * CLI-Skript zum Importieren von Excel-Dateien (.xlsx) in die Datenbank.
 * Verwendung (Beispiel):
 *   npx ts-node scripts/importExcel.ts --file data/devices.xlsx --type devices
 *
 * Unterstützte Typen:
 *  - kundendaten      : Kundendaten (Tabelle `Kunden`) mit zugehörigen Zählern (Tabelle `Zaehler`)
 *  - verbrauchsdaten  : Verbrauchsdaten (Tabelle `Verbrauchsdaten`)
 *
 * Erwartete Spalten für `kundendaten` (Beispiel-Header):
 *   Name | Straße | Hausnummer | Zählernummer | Installationsdatum | Mobilnummer | Festnetznummer
 *
 * Erwartete Spalten für `verbrauchsdaten` (Beispiel-Header):
 *   Zählernummer | Datum | Zählerstand
 *
 * Hinweise / Annahmen:
 * - Es existieren MySQL-Tabellen wie in `sql/tabellendatei.sql`: `Kunden`, `Zaehler`, `Verbrauchsdaten`.
 * - Bei `kundendaten` wird pro Zeile ein Kunde in `Kunden` eingefügt und der zugehörige Zähler in `Zaehler` (Verknüpfung über KundenID).
 * - Bei `verbrauchsdaten` wird die Zeile in `Verbrauchsdaten` eingefügt; vorhandene Einträge für (Zaehlernummer, Datum) werden aktualisiert.
 */

import fs from 'fs';
import path from 'path';
import { parseArgs } from 'node:util';
import xlsx from 'xlsx';
import pool from '../src/db';
import { importKundendatenFromRows, importVerbrauchsdatenFromRows } from './importerShared';

// Einfache CLI-Argumente mit node:util.parseArgs
const { values } = parseArgs({
  options: {
    file: { type: 'string' },
    type: { type: 'string' }
  }
});

const file = values.file as string | undefined;
const importType = (values.type as string | undefined) || 'kundendaten';

if (!file) {
  console.error('Fehler: --file muss angegeben werden. Beispiel: --file data/devices.xlsx');
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), file);
if (!fs.existsSync(filePath)) {
  console.error('Fehler: Datei nicht gefunden:', filePath);
  process.exit(1);
}

// Lese die Excel-Datei
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows: any[] = xlsx.utils.sheet_to_json(sheet, { defval: null });

/**
 * Import für Kundendaten (Kunden + zugehörige Zähler)
 *
 * Erwartete Spalten: Name, Straße, Hausnummer, Zählernummer, Installationsdatum, Mobilnummer, Festnetznummer
 */
async function importKundendaten(rows: any[]) {
  console.log(`Importiere ${rows.length} Kundendatensätze...`);

  for (const row of rows) {
    const fullName = row.Name || row.name || row.Nachname || row.Vorname || row.Name || row['Name'];
    // Versuche Name in Vorname / Nachname zu splitten (Splitter: erstes Leerzeichen)
    let vorname = '';
    let nachname = '';
    if (typeof fullName === 'string' && fullName.trim().length > 0) {
      const parts = fullName.trim().split(/\s+/);
      vorname = parts.shift() || '';
      nachname = parts.join(' ') || '';
    }

  const strasse = row.Straße || row.Strasse || row.strasse || row['Straße'] || null;
    const hausnummer = row.Hausnummer || row.hausnummer || row['Hausnummer'] || null;
    const zaehlernummer = row['Zählernummer'] || row.Zaehlernummer || row.zaehlernummer || row.Zaehlernummer || null;
    const installiert = row.Installationsdatum || row.installationsdatum || row.InstallationsDatum || null;
    const mobil = row.Mobilnummer || row.mobilnummer || row.Mobil || null;
    const festnetz = row.Festnetznummer || row.festnetznummer || row.Festnetz || null;

    try {
      // Deduplizierung-Strategie:
      // 1) Wenn Zaehlernummer vorhanden und bereits in Zaehler existiert -> skip (oder verknüpfen)
      // 2) Sonst: Suche Kunden über Mobilnummer
      // 3) Alternative Suche: Kunden über Vorname+Nachname+Straße+Hausnummer
      // 4) Wenn kein Kunde gefunden: neuen Kunden anlegen
      // 5) Falls Zaehlernummer vorhanden: Zaehler mit der ermittelten KundenID anlegen

      let kundenId: number | null = null;

      if (zaehlernummer) {
        // Prüfe, ob Zaehler bereits existiert
        const [zRows] = await pool.query('SELECT KundenID FROM Zaehler WHERE Zaehlernummer = ? LIMIT 1', [zaehlernummer]);
        if ((zRows as any[]).length > 0) {
          // Zaehler existiert bereits -> verwende die verknüpfte KundenID
          kundenId = (zRows as any[])[0].KundenID || null;
          console.log(`Zaehler ${zaehlernummer} existiert bereits, verknüpfte KundenID: ${kundenId}`);
        }
      }

      if (!kundenId) {
        // Versuche Kunden über Mobilnummer zu finden (wenn vorhanden)
        if (mobil) {
          const [mRows] = await pool.query('SELECT KundenID FROM Kunden WHERE Mobilnummer = ? LIMIT 1', [mobil]);
          if ((mRows as any[]).length > 0) {
            kundenId = (mRows as any[])[0].KundenID;
            console.log(`Gefundener Kunde per Mobilnummer (${mobil}): KundenID=${kundenId}`);
          }
        }
      }

      if (!kundenId) {
        // Alternative Suche: Suche per Name + Adresse
        if (vorname || nachname || strasse || hausnummer) {
          const [nRows] = await pool.query(
            'SELECT KundenID FROM Kunden WHERE Vorname = ? AND Nachname = ? AND Straße = ? AND Hausnummer = ? LIMIT 1',
            [vorname, nachname, strasse, hausnummer]
          );
          if ((nRows as any[]).length > 0) {
            kundenId = (nRows as any[])[0].KundenID;
            console.log(`Gefundener Kunde per Name/Adresse: KundenID=${kundenId}`);
          }
        }
      }

      if (!kundenId) {
        // Kein bestehender Kunde gefunden -> neuen anlegen
        const [res] = await pool.query(
          'INSERT INTO Kunden (Vorname, Nachname, Straße, Hausnummer, Mobilnummer, Festnetznummer) VALUES (?, ?, ?, ?, ?, ?)',
          [vorname, nachname, strasse, hausnummer, mobil, festnetz]
        );
        kundenId = (res as any).insertId;
        console.log(`Neuer Kunde angelegt: KundenID=${kundenId} (${vorname} ${nachname})`);
      }

      // Falls Zaehlernummer vorhanden, lege den Zaehler an, falls noch nicht vorhanden
      if (zaehlernummer) {
        const [exists] = await pool.query('SELECT Zaehlernummer FROM Zaehler WHERE Zaehlernummer = ? LIMIT 1', [zaehlernummer]);
        if ((exists as any[]).length === 0) {
          await pool.query(
            'INSERT INTO Zaehler (Zaehlernummer, Installationsdatum, KundenID) VALUES (?, ?, ?)',
            [zaehlernummer, installiert, kundenId]
          );
          console.log(`Zaehler ${zaehlernummer} für KundenID=${kundenId} angelegt.`);
        } else {
          console.log(`Zaehler ${zaehlernummer} bereits vorhanden, kein Insert.`);
        }
      } else {
        console.warn('Warnung: Keine Zählernummer für Kunde', vorname, nachname);
      }
    } catch (err) {
      console.error('Fehler beim Import von Kunde/Zaehler:', fullName, err);
    }
  }

  console.log('Kundendaten-Import abgeschlossen.');
}

/**
 * Import für Verbrauchsdaten
 *
 * Erwartete Spalten: Zählernummer, Datum, Zählerstand
 * Bei Konflikt (Zaehlernummer + Datum) wird der Zählerstand aktualisiert.
 */
async function importVerbrauchsdaten(rows: any[]) {
  console.log(`Importiere ${rows.length} Verbrauchsdatensätze...`);

  for (const row of rows) {
    const zaehlernummer = row['Zählernummer'] || row.Zaehlernummer || row.Zaehler || row.zaehlernummer || row.zaehler;
    const datum = row.Datum || row.datum || row.Datum || row.date || null;
    const zaehlerstand = row['Zählerstand'] || row.Zählerstand || row.zaehlerstand || row.Wert || row.value || null;

    if (!zaehlernummer || !datum || zaehlerstand === null || zaehlerstand === undefined) {
      console.warn('Warnung: Ungültige Zeile (fehlende Spalten), übersprungen:', row);
      continue;
    }

    try {
      // Verwende ON DUPLICATE KEY UPDATE, damit vorhandene Messwerte überschrieben werden
      await pool.query(
        'INSERT INTO Verbrauchsdaten (Zaehlernummer, Datum, Zaehlerstand) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE Zaehlerstand = VALUES(Zaehlerstand)',
        [zaehlernummer, datum, zaehlerstand]
      );
    } catch (err) {
      console.error('Fehler beim Einfügen von Verbrauchsdaten:', row, err);
    }
  }

  console.log('Verbrauchsdaten-Import abgeschlossen.');
}

async function main() {
  try {
    // Unterstützte Aliase: kundendaten, kunden, verbrauchsdaten, verbrauch
    const t = importType.toLowerCase();
    if (t === 'kundendaten' || t === 'kunden' || t === 'kunden2025') {
      const res = await importKundendatenFromRows(rows);
      res.forEach(r => console.log(r));
    } else if (t === 'verbrauchsdaten' || t === 'verbrauch' || t === 'logs') {
      const res = await importVerbrauchsdatenFromRows(rows);
      res.forEach(r => console.log(r));
    } else if (t === 'devices') {
      // Legacy: Geräte-Import ('devices') ist in dieser Version nicht unterstützt
      console.error("Der Import-Typ 'devices' ist in dieser Version nicht unterstützt. Verwende 'kundendaten' oder 'verbrauchsdaten'.");
    } else {
      console.error('Unbekannter Import-Typ:', importType, "(erwartet: 'kundendaten' oder 'verbrauchsdaten')");
    }
  } catch (err) {
    console.error('Import Fehler:', err);
  } finally {
    // Pool schließen
    await pool.end();
    process.exit(0);
  }
}

main();
