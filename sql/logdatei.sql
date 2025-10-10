-- ========================================
-- Logdatei / Audit-Tabelle für Stromkraftwerk
-- Autor: Gabriel
-- Erstellt: 26.09.25
-- Zweck: GoBD-konforme Änderungsverfolgung
-- Hinweis: MySQL-kompatible Version, inkl. Trigger für Insert, Update, Delete
-- ========================================

-- ======================
-- 1. Audit-Tabelle erstellen
-- ======================
CREATE TABLE IF NOT EXISTS Audit_Log (
    LogID INT AUTO_INCREMENT PRIMARY KEY,       -- Eindeutige ID pro Eintrag
    Tabelle VARCHAR(50),                         -- Name der betroffenen Tabelle
    DatensatzID INT,                             -- ID des geänderten Datensatzes
    Aktion VARCHAR(10),                          -- 'INSERT', 'UPDATE', 'DELETE'
    Aenderungsdatum TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Zeitpunkt der Änderung
    Benutzer VARCHAR(50),                        -- Wer die Aktion durchgeführt hat
    Bemerkung TEXT                               -- Details zur Änderung
) ENGINE=InnoDB;

-- ======================
-- 2. Delimiter setzen für Trigger
-- ======================
DELIMITER $$

-- ======================
-- Kunden-Tabelle Trigger (mit Vorname + Nachname)
-- ======================

-- Insert Trigger
CREATE TRIGGER trg_kunden_insert
AFTER INSERT ON Kunden
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Kunden',
        NEW.KundenID,
        'INSERT',
        CURRENT_USER(),
        CONCAT('Neuer Kunde angelegt: Vorname = ', NEW.Vorname, 
               ', Nachname = ', NEW.Nachname,
               ', Straße = ', NEW.Straße, 
               ', Hausnummer = ', NEW.Hausnummer)
    );
END$$

-- Update Trigger
CREATE TRIGGER trg_kunden_update
AFTER UPDATE ON Kunden
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Kunden',
        NEW.KundenID,
        'UPDATE',
        CURRENT_USER(),
        CONCAT('Kundendaten geändert: Vorname ', OLD.Vorname, ' -> ', NEW.Vorname,
               ', Nachname ', OLD.Nachname, ' -> ', NEW.Nachname,
               ', Straße ', OLD.Straße, ' -> ', NEW.Straße,
               ', Hausnummer ', OLD.Hausnummer, ' -> ', NEW.Hausnummer)
    );
END$$

-- Delete Trigger
CREATE TRIGGER trg_kunden_delete
AFTER DELETE ON Kunden
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Kunden',
        OLD.KundenID,
        'DELETE',
        CURRENT_USER(),
        CONCAT('Kunde gelöscht: Vorname = ', OLD.Vorname, ', Nachname = ', OLD.Nachname)
    );
END$$

-- ======================
-- Zaehler-Tabelle Trigger
-- ======================

CREATE TRIGGER trg_zaehler_insert
AFTER INSERT ON Zaehler
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Zaehler',
        NEW.Zaehlernummer,
        'INSERT',
        CURRENT_USER(),
        CONCAT('Neuer Zähler: Zaehlernummer = ', NEW.Zaehlernummer,
               ', KundenID = ', NEW.KundenID,
               ', Installationsdatum = ', NEW.Installationsdatum)
    );
END$$

CREATE TRIGGER trg_zaehler_update
AFTER UPDATE ON Zaehler
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Zaehler',
        NEW.Zaehlernummer,
        'UPDATE',
        CURRENT_USER(),
        CONCAT('Zähler aktualisiert: Installationsdatum ', OLD.Installationsdatum, ' -> ', NEW.Installationsdatum)
    );
END$$

CREATE TRIGGER trg_zaehler_delete
AFTER DELETE ON Zaehler
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Zaehler',
        OLD.Zaehlernummer,
        'DELETE',
        CURRENT_USER(),
        CONCAT('Zähler gelöscht: Zaehlernummer = ', OLD.Zaehlernummer, ', KundenID = ', OLD.KundenID)
    );
END$$

-- ======================
-- Verbrauchsdaten-Tabelle Trigger
-- ======================

CREATE TRIGGER trg_verbrauchsdaten_insert
AFTER INSERT ON Verbrauchsdaten
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Verbrauchsdaten',
        NEW.Zaehlernummer,
        'INSERT',
        CURRENT_USER(),
        CONCAT('Neuer Zählerstand: ', NEW.Zaehlerstand, ' am ', NEW.Datum)
    );
END$$

CREATE TRIGGER trg_verbrauchsdaten_update
AFTER UPDATE ON Verbrauchsdaten
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Verbrauchsdaten',
        NEW.Zaehlernummer,
        'UPDATE',
        CURRENT_USER(),
        CONCAT('Zählerstand geändert: ', OLD.Zaehlerstand, ' -> ', NEW.Zaehlerstand,
               ' am ', NEW.Datum)
    );
END$$

CREATE TRIGGER trg_verbrauchsdaten_delete
AFTER DELETE ON Verbrauchsdaten
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Verbrauchsdaten',
        OLD.Zaehlernummer,
        'DELETE',
        CURRENT_USER(),
        CONCAT('Zählerstand gelöscht: ', OLD.Zaehlerstand, ' am ', OLD.Datum)
    );
END$$

-- ======================
-- Anlagen-Tabelle Trigger
-- ======================

CREATE TRIGGER trg_anlagen_insert
AFTER INSERT ON Anlagen
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Anlagen',
        NEW.AnlageID,
        'INSERT',
        CURRENT_USER(),
        CONCAT('Neue Anlage: Name = ', NEW.Name, ', Typ = ', NEW.Typ, ', Status = ', NEW.Status)
    );
END$$

CREATE TRIGGER trg_anlagen_update
AFTER UPDATE ON Anlagen
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Anlagen',
        NEW.AnlageID,
        'UPDATE',
        CURRENT_USER(),
        CONCAT('Anlage aktualisiert: Status ', OLD.Status, ' -> ', NEW.Status)
    );
END$$

CREATE TRIGGER trg_anlagen_delete
AFTER DELETE ON Anlagen
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Anlagen',
        OLD.AnlageID,
        'DELETE',
        CURRENT_USER(),
        CONCAT('Anlage gelöscht: Name = ', OLD.Name)
    );
END$$

-- ======================
-- Wartungen-Tabelle Trigger
-- ======================

CREATE TRIGGER trg_wartungen_insert
AFTER INSERT ON Wartungen
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Wartungen',
        NEW.WartungID,
        'INSERT',
        CURRENT_USER(),
        CONCAT('Neue Wartung für AnlageID ', NEW.AnlageID, ' am ', NEW.Wartungsdatum, ', Typ = ', NEW.Wartungstyp)
    );
END$$

CREATE TRIGGER trg_wartungen_update
AFTER UPDATE ON Wartungen
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Wartungen',
        NEW.WartungID,
        'UPDATE',
        CURRENT_USER(),
        CONCAT('Wartung aktualisiert: Beschreibung ', OLD.Beschreibung, ' -> ', NEW.Beschreibung)
    );
END$$

CREATE TRIGGER trg_wartungen_delete
AFTER DELETE ON Wartungen
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Wartungen',
        OLD.WartungID,
        'DELETE',
        CURRENT_USER(),
        CONCAT('Wartung gelöscht: AnlageID = ', OLD.AnlageID, ', Datum = ', OLD.Wartungsdatum)
    );
END$$

-- ======================
-- 3. Delimiter zurücksetzen
-- ======================
DELIMITER ;
