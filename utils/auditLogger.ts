/**
 * logAudit
 *
 * Kleiner Audit-Logger, der Audit-Informationen ausgibt.
 * Zweck: Kurze, zentrale Stelle um Änderungen/Operationen zu protokollieren.
 *
 * Parameter:
 *  - table: Name der betroffenen Tabelle/Entität
 *  - id:   Primärschlüssel des betroffenen Eintrags (optional, kann undefined sein)
 *  - action: kurze Aktion, z.B. 'create', 'update', 'delete', 'import'
 *  - user: Benutzerkennung (z.B. Email oder Benutzer-ID) der den Vorgang ausgelöst hat
 *  - comment: optionaler Freitext zur Aktion (z.B. warum, Quelle, Datei-Name)
 *
 * Hinweis zur Persistenz:
 *  - Aktuell schreibt diese Funktion nur in die Konsole (entwicklungsfreundlich).
 *  - Für produktive/GoBD-konforme Nutzung sollte diese Ausgabe in eine persistente
 *    Audit-Tabelle oder ein unveränderbares Log (append-only) geschrieben werden.
 *  - Die Signatur belässt `id` optional, damit z.B. Imports oder Massen-Operationen
 *    ohne einzelne IDs protokolliert werden können.
 */
export function logAudit(table: string, id: number | undefined, action: string, user: string, comment: string) {
  const idStr = id !== undefined ? id.toString() : 'undefined';
  console.log(`[Audit] Tabelle: ${table}, ID: ${idStr}, Aktion: ${action}, Benutzer: ${user}, Kommentar: ${comment}`);
}
