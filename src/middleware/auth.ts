import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Auth-Middleware
 *
 * Diese Middleware prüft das Vorhandensein und die Gültigkeit eines JWT-Access-Tokens
 * im Authorization-Header (Format: "Bearer <token>").
 * Bei erfolgreicher Verifikation wird `req.user` gesetzt und die Anfrage an die nächste
 * Middleware/Route weitergegeben.
 *
 * Hinweise zur Verwendung:
 * - Binde diese Middleware an geschützte Routen: z.B. `router.get('/secure', auth, handler)`
 * - Erwartetes Token-Format: Authorization: Bearer <token>
 * - Die Middleware augments den Express-Request-Typ (siehe `declare global` weiter unten)
 *
 * Sicherheits-Hinweise:
 * - Nutze in Produktion unbedingt ein sicheres `JWT_SECRET` in der Umgebung (keinen Hardcode).
 * - Setze kurze Ablaufzeiten für Tokens und implementiere ggf. Refresh-Tokens.
 * - Logge keine sensiblen Token-Inhalte in Produktiv-Logs.
 */

// Erweitere den Express Request Type um user
declare global {
  namespace Express {
    interface Request {
      // Optional, weil manche Routen öffentlich sind
      user?: { id: number; email: string; role: string };
    }
  }
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
  // Token aus dem Authorization-Header extrahieren (Bearer schema)
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Keine Authentifizierung' });
  }

  try {
    // Token verifizieren. Achtung: In Tests/Dev wird ein Fallback-Secret verwendet,
    // in produktiver Umgebung unbedingt `process.env.JWT_SECRET` setzen.
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dein-geheimer-schluessel');

    // Type assertion: wir erwarten die Felder id, email und role im Payload
    req.user = decoded as { id: number; email: string; role: string };
    next();
  } catch (err) {
    // Bei Fehlern keine sensiblen Details zurückgeben
    return res.status(401).json({ message: 'Token ist ungültig' });
  }
};