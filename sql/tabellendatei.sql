-- ========================================
-- Datenbankstruktur für Stromkraftwerk
-- Autor: Gabriel
-- Erstellt: 26.09.25
-- Beschreibung: Kunden-, Zähler-, Verbrauchs- und Anlagendaten
-- ========================================

-- Kunden-Tabelle
CREATE TABLE Kunden (
    KundenID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Vorname VARCHAR(50) NOT NULL,
    Nachname VARCHAR(50) NOT NULL,
    Straße VARCHAR(100),
    Hausnummer VARCHAR(10),
    Mobilnummer VARCHAR(20),
    Festnetznummer VARCHAR(20)
);

-- Zähler-Tabelle
CREATE TABLE Zaehler (
    Zaehlernummer INT PRIMARY KEY,
    Installationsdatum DATE NOT NULL,
    KundenID INT NOT NULL,
    FOREIGN KEY (KundenID) REFERENCES Kunden(KundenID)
);

-- Verbrauchsdaten-Tabelle
CREATE TABLE Verbrauchsdaten (
    Zaehlernummer INT NOT NULL,
    Datum DATE NOT NULL,
    Zaehlerstand INT NOT NULL,
    PRIMARY KEY (Zaehlernummer, Datum),
-- die Kombination aus Zaehlernummer + Datum ein PRIMARY KEY
    FOREIGN KEY (Zaehlernummer) REFERENCES Zaehler(Zaehlernummer)
);

-- Anlagen-Tabelle
CREATE TABLE Anlagen (
    AnlageID INT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Typ VARCHAR(50),
    Inbetriebnahmedatum DATE,
    Standort VARCHAR(100),
    Status VARCHAR(50)  -- z. B. "aktiv", "wartung", "stillgelegt"
);

-- Wartungen-Tabelle
CREATE TABLE Wartungen (
    WartungID INT PRIMARY KEY,
    AnlageID INT NOT NULL,
    Wartungsdatum DATE NOT NULL,
    Beschreibung TEXT,
    Wartungstyp VARCHAR(50), -- z. B. "geplant", "notfall", "automatisch"
    FOREIGN KEY (AnlageID) REFERENCES Anlagen(AnlageID)
);

-- Users-Tabelle (für Auth / Login)
CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user'
);

-- Beispiel-Daten einfügen

INSERT INTO `kunden`(`Vorname`, `Nachname`, `Straße`, `Hausnummer`, `Mobilnummer`, `Festnetznummer`) VALUES
('Lena', 'Schmidt', 'Hauptstraße', '12', '01761234567', '0451 234567'),
('Tobias', 'Keller', 'Bergweg', '7a', '01515551234', '030 5678910'),
('Sophie', 'Neumann', 'Am Park', '22', '01601239876', '089 778899');


-- Beispiel-User (Passwort muss gesetzt werden bzw. gehasht eingesetzt werden)
-- Hinweis: Passwort hier als Platzhalter; in der echten DB bitte einen bcrypt-Hash verwenden.
INSERT INTO users (email, password, name, role) VALUES
('admin@example.com', '$2a$10$REPLACE_WITH_BCRYPT_HASH', 'Administrator', 'admin');

-- -----------------------------
-- DROP-Statements (sicheres Löschen in Abhängigkeitsreihenfolge)
-- Deaktiviert Foreign Key Prüfungen kurz, löscht Tabellen und aktiviert sie wieder
-- Reihenfolge: Verbrauchsdaten -> Zaehler -> Wartungen -> Anlagen -> Kunden
-- -----------------------------
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Verbrauchsdaten;
DROP TABLE IF EXISTS Zaehler;
DROP TABLE IF EXISTS Wartungen;
DROP TABLE IF EXISTS Anlagen;
DROP TABLE IF EXISTS Kunden;
DROP TABLE IF EXISTS users;
-- Audit_Log wird nur gelöscht, falls vorhanden
DROP TABLE IF EXISTS Audit_Log;
SET FOREIGN_KEY_CHECKS = 1;