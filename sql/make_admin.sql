-- SQL-Snippets um Administrative User zu erstellen oder zu befördern
-- 1) Befördere bestehenden Benutzer zum Admin (nach Registrierung)
--    Ersetze 'admin@example.com' mit der gewünschten Email
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';

-- 2) Direkt neuen Admin anlegen (wenn noch kein Benutzer existiert).
--    Ersetze '<hashed_password>' mit einem zuvor generierten Hash (bcrypt).
INSERT INTO users (email, password, name, role) VALUES ('admin@example.com', '<hashed_password>', 'Admin', 'admin');

-- Hinweis: Generiere das gehashte Passwort lokal mit Node:
-- node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('DeinPasswort',10).then(h=>console.log(h))"
