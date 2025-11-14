import pool from '../src/db';

// Shared Importer-Funktionen, die von CLI und Web-Route genutzt werden können.
// Beide Funktionen nehmen bereits konvertierte rows (Array of objects) entgegen.

export async function importKundendatenFromRows(rows: any[], options?: { auditUser?: string }) {
  const results: string[] = [];
  for (const row of rows) {
    const fullName = row.Name || row.name || row.Nachname || row.Vorname || row['Name'];
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
      let kundenId: number | null = null;

      if (zaehlernummer) {
        const [zRows] = await pool.query('SELECT KundenID FROM Zaehler WHERE Zaehlernummer = ? LIMIT 1', [zaehlernummer]);
        if ((zRows as any[]).length > 0) {
          kundenId = (zRows as any[])[0].KundenID || null;
          results.push(`Zaehler ${zaehlernummer} existiert bereits, KundenID=${kundenId}`);
        }
      }

      if (!kundenId && mobil) {
        const [mRows] = await pool.query('SELECT KundenID FROM Kunden WHERE Mobilnummer = ? LIMIT 1', [mobil]);
        if ((mRows as any[]).length > 0) {
          kundenId = (mRows as any[])[0].KundenID;
          results.push(`Gefundener Kunde per Mobilnummer (${mobil}): KundenID=${kundenId}`);
        }
      }

      if (!kundenId && (vorname || nachname || strasse || hausnummer)) {
        const [nRows] = await pool.query(
          'SELECT KundenID FROM Kunden WHERE Vorname = ? AND Nachname = ? AND Straße = ? AND Hausnummer = ? LIMIT 1',
          [vorname, nachname, strasse, hausnummer]
        );
        if ((nRows as any[]).length > 0) {
          kundenId = (nRows as any[])[0].KundenID;
          results.push(`Gefundener Kunde per Name/Adresse: KundenID=${kundenId}`);
        }
      }

      if (!kundenId) {
        const [res] = await pool.query(
          'INSERT INTO Kunden (Vorname, Nachname, Straße, Hausnummer, Mobilnummer, Festnetznummer) VALUES (?, ?, ?, ?, ?, ?)',
          [vorname, nachname, strasse, hausnummer, mobil, festnetz]
        );
        kundenId = (res as any).insertId;
        results.push(`Neuer Kunde angelegt: KundenID=${kundenId} (${vorname} ${nachname})`);
      }

      if (zaehlernummer) {
        const [exists] = await pool.query('SELECT Zaehlernummer FROM Zaehler WHERE Zaehlernummer = ? LIMIT 1', [zaehlernummer]);
        if ((exists as any[]).length === 0) {
          await pool.query(
            'INSERT INTO Zaehler (Zaehlernummer, Installationsdatum, KundenID) VALUES (?, ?, ?)',
            [zaehlernummer, installiert, kundenId]
          );
          results.push(`Zaehler ${zaehlernummer} für KundenID=${kundenId} angelegt.`);
        } else {
          results.push(`Zaehler ${zaehlernummer} bereits vorhanden, kein Insert.`);
        }
      } else {
        results.push(`Warnung: Keine Zählernummer für Kunde ${vorname} ${nachname}`);
      }
    } catch (err) {
      results.push(`Fehler beim Import von ${fullName}: ${String(err)}`);
    }
  }
  return results;
}

export async function importVerbrauchsdatenFromRows(rows: any[]) {
  const results: string[] = [];
  for (const row of rows) {
    const zaehlernummer = row['Zählernummer'] || row.Zaehlernummer || row.Zaehler || row.zaehlernummer || row.zaehler;
    const datum = row.Datum || row.datum || row.Datum || row.date || null;
    const zaehlerstand = row['Zählerstand'] || row.Zählerstand || row.zaehlerstand || row.Wert || row.value || null;

    if (!zaehlernummer || !datum || zaehlerstand === null || zaehlerstand === undefined) {
      results.push(`Ungültige Zeile (fehlende Spalten), übersprungen: ${JSON.stringify(row)}`);
      continue;
    }

    try {
      await pool.query(
        'INSERT INTO Verbrauchsdaten (Zaehlernummer, Datum, Zaehlerstand) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE Zaehlerstand = VALUES(Zaehlerstand)',
        [zaehlernummer, datum, zaehlerstand]
      );
      results.push(`Verbrauchsdaten für Zaehler=${zaehlernummer}, Datum=${datum} eingefügt/aktualisiert.`);
    } catch (err) {
      results.push(`Fehler beim Einfügen von Verbrauchsdaten: ${JSON.stringify(row)} ; err=${String(err)}`);
    }
  }

  return results;
}
