/**
 * auth.ts - Authentifizierungs-Routen
 * 
 * Diese Datei definiert die Routen für:
 * - Benutzerregistrierung
 * - Login
 * - Benutzerverwaltung (Admin)
 * 
 * Alle Routen verwenden Express-Validator für die Eingabevalidierung
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { login, register, getAllUsers, setUserRole } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = Router();

/**
 * Validierungsregeln für die Registrierung
 * - Email muss gültig sein
 * - Passwort mindestens 6 Zeichen
 * - Name darf nicht leer sein
 */
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Gültige Email-Adresse erforderlich')
    .normalizeEmail(), // Normalisiert E-Mail (lowercase, etc.)

  body('password')
    .isLength({ min: 6 })
    .withMessage('Passwort muss mindestens 6 Zeichen lang sein')
    .matches(/\d/)
    .withMessage('Passwort muss mindestens eine Zahl enthalten'),

  body('name')
    .notEmpty()
    .withMessage('Name ist erforderlich')
    .trim() // Entfernt Leerzeichen am Anfang/Ende
];

/**
 * Validierungsregeln für Login
 * - Email muss gültig sein
 * - Passwort darf nicht leer sein
 */
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Gültige Email-Adresse erforderlich')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Passwort ist erforderlich')
];

// Routen definieren
router.post('/register', registerValidation, register);  // Neue Benutzer registrieren
router.post('/login', loginValidation, login);          // Benutzer einloggen
router.get('/users', auth, getAllUsers);                // Alle Benutzer auflisten (nur Admin)
router.put('/users/:id/role', auth, setUserRole);     // Admin-only: Rolle setzen

export default router;