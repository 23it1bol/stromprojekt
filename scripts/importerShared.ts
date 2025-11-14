import pool from '../src/db';

// Allgemeine Helfer
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Normalisiert verschiedene Datumsformate (Date-Objekt, ISO-String, Excel-Serial) zu 'YYYY-MM-DD'
 */
const normalizeDateToSQL = (d: any): string | null => {
  if (d === null || d === undefined || d === '') return null;
  if (d instanceof Date) {
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  }
  if (typeof d === 'number') {
    // Excel serial date -> JS timestamp
    try {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const ms = Math.round(d * 24 * 60 * 60 * 1000);
      const dt = new Date(excelEpoch.getTime() + ms);
      if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
    } catch (e) {
      // fall through
    }
  }
  if (typeof d === 'string') {
    const s = d.trim();
    const isoMatch = s.match(/^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    const deMatch = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
    if (deMatch) return `${deMatch[3]}-${deMatch[2]}-${deMatch[1]}`;
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  }
  return null;
};

/**
 * Normalisiert numerische Felder: entfernt Nicht-Ziffern (außer - und .)
 * Liefert null bei ungültigen Werten.
 */
const normalizeNumber = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') {
    if (isNaN(v)) return null;
    return v;
  }
  const s = String(v).trim();
  // entferne alles außer Ziffern, Minus und Punkt
  const cleaned = s.replace(/[^0-9.\-]/g, '');
  if (cleaned === '' || cleaned === '.' || cleaned === '-' ) return null;
  const n = Number(cleaned);
  if (isNaN(n)) return null;
  return n;
};

/**
 * Shared Importer-Funktionen, die von CLI und Web-Route genutzt werden können.
 * Beide Funktionen nehmen bereits konvertierte rows (Array of objects) entgegen.
 */

/**
 * importKundendatenFromRows - Importiert Kundendaten und Zählernummern aus einem Excel/CSV-Array
 * 
 * Workflow:
 * 1. Iteriert über alle Zeilen des Import-Arrays
 * 2. Extrahiert und normalisiert Daten (Kundendaten + Zählernummern)
 * 3. Dedupliziert Kunden mittels drei Strategien:
 *    a) Prüfung nach Zählernummer (falls bereits vorhanden)
 *    b) Prüfung nach Mobilnummer (falls noch keine KundenID)
 *    c) Prüfung nach Name+Adresse (Vorname, Nachname, Straße, Hausnummer)
 * 4. Erstellt neue Kunden nur, wenn keine Duplikate gefunden
 * 5. Verknüpft oder erstellt die Zählernummer mit der KundenID
 * 
 * @param rows - Array von Objekten (Zeilen aus Excel/CSV)
 * @param options - Optional: { auditUser?: string } für Audit-Logging
 * @returns Array von Meldungen (Erfolg/Warnung/Fehler) für jede verarbeitete Zeile
 */
export async function importKundendatenFromRows(rows: any[], options?: { auditUser?: string }) {
  const results: string[] = [];
  
  
  
  // Iteriere über jede Zeile des Import-Arrays
  for (const row of rows) {
    // --- STEP 1: Daten extrahieren und normalisieren ---
    // Versuche den vollständigen Namen aus verschiedenen Spalten-Varianten zu extrahieren
    // (da Excel-Import unterschiedliche Schreibweisen haben kann)
    const fullName = row.Name || row.name || row.Nachname || row.Vorname || row['Name'];
    
    // Spalte den vollständigen Namen in Vorname + Nachname auf
    // Z.B. "Max Mustermann" → vorname="Max", nachname="Mustermann"
    let vorname = '';
    let nachname = '';
    if (typeof fullName === 'string' && fullName.trim().length > 0) {
      const parts = fullName.trim().split(/\s+/); // Teile nach Leerzeichen
      vorname = parts.shift() || ''; // Erstes Element = Vorname
      nachname = parts.join(' ') || ''; // Rest = Nachname
    }

    // Extrahiere weitere Felder mit mehreren Spalten-Varianten (Umlaute, Schreibweisen)
    const strasse = row.Straße || row.Strasse || row.strasse || row['Straße'] || null;
    const hausnummer = row.Hausnummer || row.hausnummer || row['Hausnummer'] || null;
    const zaehlernummer = row['Zählernummer'] || row.Zaehlernummer || row.zaehlernummer || row.Zaehlernummer || null;
    const installiertRaw = row.Installationsdatum || row.installationsdatum || row.InstallationsDatum || null;
    const installiert = normalizeDateToSQL(installiertRaw);
    const mobil = row.Mobilnummer || row.mobilnummer || row.Mobil || null;
    const festnetz = row.Festnetznummer || row.festnetznummer || row.Festnetz || null;

    try {
      let kundenId: number | null = null;

      // --- STEP 2: Suche nach existierenden Kunden (Deduplizierung) ---
      
      // Strategie 1: Prüfe nach Zählernummer
      // Wenn eine Zählernummer existiert und bereits in der DB ist, 
      // dann haben wir schon den Kunden dazu
      if (zaehlernummer) {
        const [zRows] = await pool.query(
          'SELECT KundenID FROM Zaehler WHERE Zaehlernummer = ? LIMIT 1',
          [zaehlernummer]
        );
        if ((zRows as any[]).length > 0) {
          kundenId = (zRows as any[])[0].KundenID || null;
          results.push(`Zaehler ${zaehlernummer} existiert bereits, KundenID=${kundenId}`);
        }
      }

      // Strategie 2: Suche per Mobilnummer (falls noch keine KundenID)
      // Mobilnummern sind eindeutig und helfen beim Duplizieren-Erkennen
      if (!kundenId && mobil) {
        const [mRows] = await pool.query(
          'SELECT KundenID FROM Kunden WHERE Mobilnummer = ? LIMIT 1',
          [mobil]
        );
        if ((mRows as any[]).length > 0) {
          kundenId = (mRows as any[])[0].KundenID;
          results.push(`Gefundener Kunde per Mobilnummer (${mobil}): KundenID=${kundenId}`);
        }
      }

      // Strategie 3: Suche per Name + Adresse (Fuzzy-Match)
      // Wenn Vorname, Nachname, Straße und Hausnummer alle passen, ist es wahrscheinlich derselbe Kunde
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

      // --- STEP 3: Neuen Kunden anlegen (falls noch nicht vorhanden) ---
      if (!kundenId) {
        const [res] = await pool.query(
          'INSERT INTO Kunden (Vorname, Nachname, Straße, Hausnummer, Mobilnummer, Festnetznummer) VALUES (?, ?, ?, ?, ?, ?)',
          [vorname, nachname, strasse, hausnummer, mobil, festnetz]
        );
        kundenId = (res as any).insertId; // Hole die neu generierte ID
        results.push(`Neuer Kunde angelegt: KundenID=${kundenId} (${vorname} ${nachname})`);
      }

      // --- STEP 4: Zählernummer verknüpfen oder anlegen ---
      if (zaehlernummer) {
        // Prüfe, ob diese Zählernummer bereits existiert
        const [exists] = await pool.query(
          'SELECT Zaehlernummer FROM Zaehler WHERE Zaehlernummer = ? LIMIT 1',
          [zaehlernummer]
        );
        if ((exists as any[]).length === 0) {
          // Zählernummer existiert noch nicht → Neue Zeile anlegen
          const normZaehler = normalizeNumber(zaehlernummer) ?? (typeof zaehlernummer === 'string' ? Number(String(zaehlernummer).replace(/\D/g, '')) : null);
          await pool.query(
            'INSERT INTO Zaehler (Zaehlernummer, Installationsdatum, KundenID) VALUES (?, ?, ?)',
            [normZaehler, installiert, kundenId]
          );
          results.push(`Zaehler ${normZaehler} für KundenID=${kundenId} angelegt.`);
        } else {
          // Zählernummer existiert bereits → Überspringen (Duplikat)
          results.push(`Zaehler ${zaehlernummer} bereits vorhanden, kein Insert.`);
        }
      } else {
        // Warnung: Kunde ohne Zählernummer ist selten sinnvoll
        results.push(`Warnung: Keine Zählernummer für Kunde ${vorname} ${nachname}`);
      }
    } catch (err) {
      // Fehlerbehandlung: Logge Fehler und fahre mit nächster Zeile fort
      results.push(`Fehler beim Import von ${fullName}: ${String(err)}`);
    }
  }
  return results;
}

/**
 * importVerbrauchsdatenFromRows - Importiert Verbrauchsdaten (Zähler-Readings) aus einem Excel/CSV-Array
 * 
 * Workflow:
 * 1. Iteriert über alle Zeilen des Import-Arrays
 * 2. Extrahiert Zählernummer, Datum und Zählerstand
 * 3. Validiert, dass alle erforderlichen Felder vorhanden sind
 * 4. Fügt Verbrauchsdaten in DB ein oder aktualisiert existierende Einträge (Duplikate)
 * 5. Nutzt "ON DUPLICATE KEY UPDATE" für Idempotenz (mehrfaches Importieren ist sicher)
 * 
 * Hinweis: Diese Funktion erkennt Duplikate anhand der Kombination (Zaehlernummer, Datum)
 * und aktualisiert stattdessen den Zählerstand.
 * 
 * @param rows - Array von Objekten (Zeilen aus Excel/CSV)
 * @returns Array von Meldungen (Erfolg/Warnung/Fehler) für jede verarbeitete Zeile
 */
export async function importVerbrauchsdatenFromRows(rows: any[]) {
  const results: string[] = [];
  
  // Iteriere über jede Zeile des Import-Arrays
  for (const row of rows) {
    // --- STEP 1: Daten extrahieren und normalisieren ---
    // Versuche Zählernummer aus verschiedenen Spalten-Varianten zu extrahieren
    const zaehlernummer = 
      row['Zählernummer'] || row.Zählernummer || row.zaehlerstand || row.Zaehler || 
      row.zaehlernummer || row.zaehler;
    
    // Extrahiere Datum (Zeitstempel der Messung)
    const datumRaw = row.Datum || row.datum || row.date || null;
    const datum = normalizeDateToSQL(datumRaw);
    
    // Extrahiere den Zählerstand/Verbrauchswert
    // (kann verschiedene Namen haben: "Zählerstand", "Wert", "value" etc.)
    const zaehlerstandRaw =
      row['Zählerstand'] || row.Zählerstand || row.zaehlerstand ||
      row.Wert || row.value || null;
    const normZaehler = normalizeNumber(zaehlernummer) ?? (typeof zaehlernummer === 'string' ? Number(String(zaehlernummer).replace(/\D/g, '')) : null);
    const normStand = normalizeNumber(zaehlerstandRaw);

    // --- STEP 2: Validierung ---
    // Prüfe, dass alle erforderlichen Felder vorhanden sind
    // Eine gültige Verbrauchsdaten-Zeile benötigt: Zählernummer, Datum, Zählerstand
    if (!normZaehler || !datum || normStand === null || normStand === undefined) {
      // Fehler: Pflichtfelder fehlen → Zeile überspringen und Warnung ausgeben
      results.push(`Ungültige Zeile (fehlende Spalten), übersprungen: ${JSON.stringify(row)}`);
      continue; // Weiter zur nächsten Zeile
    }

    try {
      // --- STEP 3: Einfügen oder Aktualisieren ---
      // Nutze "ON DUPLICATE KEY UPDATE" für sichere Duplikat-Behandlung
      // Das bedeutet:
      // - Falls (Zaehlernummer, Datum) nicht existiert: INSERT (neue Zeile)
      // - Falls (Zaehlernummer, Datum) existiert: UPDATE (Zählerstand aktualisieren)
      // Dies macht den Import idempotent (wiederholbar ohne Fehler)
      await pool.query(
        'INSERT INTO Verbrauchsdaten (Zaehlernummer, Datum, Zaehlerstand) ' +
        'VALUES (?, ?, ?) ' +
        'ON DUPLICATE KEY UPDATE Zaehlerstand = VALUES(Zaehlerstand)',
        [normZaehler, datum, normStand]
      );
      
      // Erfolg: Bestätige die Aktion
      results.push(`Verbrauchsdaten für Zaehler=${normZaehler}, Datum=${datum} eingefügt/aktualisiert.`);
    } catch (err) {
      // Fehlerbehandlung: Logge Fehler und fahre mit nächster Zeile fort
      results.push(
        `Fehler beim Einfügen von Verbrauchsdaten: ${JSON.stringify(row)} ; err=${String(err)}`
      );
    }
  }

  return results;
}
