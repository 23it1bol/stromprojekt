/**
 * authController.ts - Controller für Authentifizierung und Benutzerverwaltung
 * 
 * Stellt die Hauptlogik für:
 * - Benutzerregistrierung
 * - Login/Authentifizierung
 * - Benutzerverwaltung
 * bereit.
 */

// Kurze Hinweise zu den Imports (knapp):
// Request/Response: Typen für Express-Handler
import { Request, Response } from 'express';
// bcryptjs: Passwörter sicher hashen/prüfen
import bcrypt from 'bcryptjs';
// jsonwebtoken: JWT erstellen/prüfen für Auth
import jwt from 'jsonwebtoken';
// validationResult: Ergebnis von express-validator Prüfungen
import { validationResult } from 'express-validator';
// pool: MySQL-Verbindungspool (aus src/db)
import pool from '../src/db';
import { logAudit } from '../utils/auditLogger';

/**
 * Registrierung eines neuen Benutzers
 * 
 * @param req - Express Request mit name, email, password im Body
 * @param res - Express Response
 * 
 * Ablauf:
 * 1. Validierung der Eingabedaten
 * 2. Prüfung ob Benutzer bereits existiert
 * 3. Passwort hashen
 * 4. Benutzer in DB speichern
 * 5. JWT Token generieren
 */
export const register = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let { email, password, name } = req.body;
    // Stelle sicher, dass Email vorhanden ist und normalisiere sie
    if (!email) return res.status(400).json({ message: 'Email ist erforderlich' });
    email = String(email).trim().toLowerCase();

    // Standardrolle für neue Benutzer. Rolle darf nicht vom Client gesetzt werden.
    const role = 'user';

    // Prüfe ob Benutzer bereits existiert
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if ((existingUsers as any[]).length > 0) {
      return res.status(400).json({ message: 'Benutzer existiert bereits' });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // Benutzer in DB speichern
    // INSERT inkl. role
    const [result] = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, role]
    );

    // JWT Token generieren (mit der Rolle)
    const token = jwt.sign(
      { id: (result as any).insertId, email, role },
      process.env.JWT_SECRET || 'dein-geheimer-schluessel',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Benutzer erfolgreich registriert',
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let { email, password } = req.body;
    if (!email) return res.status(400).json({ message: 'Email ist erforderlich' });
    email = String(email).trim().toLowerCase();

    // Benutzer in DB suchen
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if ((users as any[]).length === 0) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    const user = (users as any[])[0];

    // Passwort vergleichen
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    // JWT Token generieren
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dein-geheimer-schluessel',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Erfolgreich eingeloggt',
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Alle Benutzer abrufen (nur für Admin)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Prüfe ob der aktuelle Benutzer Admin ist
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    const [users] = await pool.query('SELECT id, email, name, role FROM users');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};

// Admin-only: Setzt die Rolle eines Benutzers (z. B. 'admin' oder 'user')
export const setUserRole = async (req: Request, res: Response) => {
  try {
    // auth-Middleware muss req.user befüllen
    const requester = (req as any).user;
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    const id = parseInt(req.params.id, 10);
    const { role } = req.body;
    const allowedRoles = ['admin', 'user', 'operator'];
    if (isNaN(id) || !role || !allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Ungültige Eingaben (erwarte role: admin|user|operator)' });
    }

    const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    const affected = (result as any).affectedRows as number;
    if (affected === 0) return res.status(404).json({ message: 'Benutzer nicht gefunden' });

    // Audit-Log schreiben
    try {
      logAudit('users', id, 'UPDATE_ROLE', requester.email || String(requester.id), `Rolle geändert zu ${role}`);
    } catch (e) {
      console.warn('Audit log failed:', e);
    }

    res.json({ message: 'Rolle aktualisiert', id, role });
  } catch (error) {
    console.error('Fehler beim Setzen der Rolle:', error);
    res.status(500).json({ message: 'Server Fehler' });
  }
};