export function logAudit(table: string, id: number, action: string, user: string, comment: string) {
  console.log(`[Audit] Tabelle: ${table}, ID: ${id}, Aktion: ${action}, Benutzer: ${user}, Kommentar: ${comment}`);
}
