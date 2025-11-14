/**
 * auth.ts - JWT-basierte Authentifizierungs-Middleware
 * 
 * Diese Middleware prüft bei jeder Anfrage, ob ein gültiger JWT-Token vorhanden ist.
 * Sie wird verwendet, um geschützte Routen abzusichern.
 * 
 * Funktionsweise:
 * 1. Token aus dem Authorization-Header extrahieren
 * 2. Token mit JWT-Secret verifizieren
 * 3. Benutzerinformationen an Request-Objekt anhängen
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// TypeScript: Erweitere den Express Request Type um user-Property
// Dies ermöglicht Zugriff auf req.user in geschützten Routen
declare global {
  namespace Express {
    interface Request {
      user?: { 
        id: number;      // Benutzer-ID aus der Datenbank
        email: string;   // E-Mail des Benutzers
        role: string;    // Rolle (z.B. 'user' oder 'admin')
      };
    }
  }
}

/**
 * Authentifizierungs-Middleware
 * Prüft den JWT-Token und fügt Benutzerinformationen zum Request hinzu
 * 
 * @param req - Express Request-Objekt
 * @param res - Express Response-Objekt
 * @param next - Callback für die nächste Middleware
 */
export const auth = (req: Request, res: Response, next: NextFunction) => {
  // Bearer Token aus Authorization-Header extrahieren
  // Format: "Bearer eyJhbGciOiJIUzI1NiIs..."
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Keine Authentifizierung' });
  }

  try {
    // Token verifizieren und decodieren
    // Bei ungültigem Token wird eine Exception geworfen
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'dein-geheimer-schluessel'
    );

    // Decodierte Benutzerinformationen an Request anhängen
    req.user = decoded as { id: number; email: string; role: string };
    
    // Weiter zur nächsten Middleware/Route
    next();
  } catch (err) {
    // Token ist ungültig oder abgelaufen
    res.status(401).json({ message: 'Token ist ungültig' });
  }
};