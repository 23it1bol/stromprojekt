-- ========================================
-- Logdatei / Audit-Tabelle für Stromkraftwerk
-- Autor: Gabriel
-- Erstellt: 26.09.25
-- Zweck: GoBD-konforme Änderungsverfolgung
-- Enthält: Audit-Tabelle + Trigger für Insert, Update, Delete
-- ========================================

-- 1. Audit-Tabelle erstellen
CREATE TABLE IF NOT EXISTS Audit_Log (
    LogID SERIAL PRIMARY KEY,
    Tabelle VARCHAR(50),        -- Name der betroffenen Tabelle
    DatensatzID INT,            -- ID des geänderten Datensatzes
    Aktion VARCHAR(10),         -- 'INSERT', 'UPDATE', 'DELETE'
    Änderungsdatum TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Benutzer VARCHAR(50),       -- Wer die Aktion durchgeführt hat
    Bemerkung TEXT              -- Details zur Änderung
);

DELIMITER $$

-- ======================
-- Kunden-Tabelle
-- ======================
-- Insert
CREATE TRIGGER trg_kunden_insert
AFTER INSERT ON Kunden
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Kunden',
        NEW.KundenID,
        'INSERT',
        CURRENT_USER,
        CONCAT('Neuer Kunde angelegt: Name = ', NEW.Name, 
               ', Straße = ', NEW.Straße, 
               ', Hausnummer = ', NEW.Hausnummer)
    );
END$$

-- Update
CREATE TRIGGER trg_kunden_update
AFTER UPDATE ON Kunden
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Kunden',
        NEW.KundenID,
        'UPDATE',
        CURRENT_USER,
        CONCAT('Kundendaten geändert: Name ', OLD.Name, ' -> ', NEW.Name,
               ', Straße ', OLD.Straße, ' -> ', NEW.Straße,
               ', Hausnummer ', OLD.Hausnummer, ' -> ', NEW.Hausnummer)
    );
END$$

-- Delete
CREATE TRIGGER trg_kunden_delete
AFTER DELETE ON Kunden
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Kunden',
        OLD.KundenID,
        'DELETE',
        CURRENT_USER,
        CONCAT('Kunde gelöscht: Name = ', OLD.Name)
    );
END$$

-- ======================
-- Zaehler-Tabelle
-- ======================
CREATE TRIGGER trg_zaehler_insert
AFTER INSERT ON Zaehler
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log(Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Zaehler',
        NEW.Zaehlernummer,
        'INSERT',
        CURRENT_USER,
        CONCAT('Neuer Zähler: Zaehlernummer = ', NEW.Zaehlernummer,
               ', KundeID = ', NEW.KundenID,
               ', Installationsdatum = ', NEW.Installationsdatum)
    );
END$$

CREATE TRIGGER trg_zaehler_update
AFTER UPDATE ON Zaehler
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log(Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Zaehler',
        NEW.Zaehlernummer,
        'UPDATE',
        CURRENT_USER,
        CONCAT('Zähler aktualisiert: Installationsdatum ', OLD.Installationsdatum, ' -> ', NEW.Installationsdatum)
    );
END$$

CREATE TRIGGER trg_zaehler_delete
AFTER DELETE ON Zaehler
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log(Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Zaehler',
        OLD.Zaehlernummer,
        'DELETE',
        CURRENT_USER,
        CONCAT('Zähler gelöscht: Zaehlernummer = ', OLD.Zaehlernummer, ', KundeID = ', OLD.KundenID)
    );
END$$

-- ======================
-- Verbrauchsdaten-Tabelle
-- ======================
CREATE TRIGGER trg_verbrauchsdaten_insert
AFTER INSERT ON Verbrauchsdaten
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log(Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Verbrauchsdaten',
        NEW.Zaehlernummer,
        'INSERT',
        CURRENT_USER,
        CONCAT('Neuer Zählerstand: ', NEW.Zaehlerstand, ' am ', NEW.Datum)
    );
END$$

CREATE TRIGGER trg_verbrauchsdaten_update
AFTER UPDATE ON Verbrauchsdaten
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log(Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Verbrauchsdaten',
        NEW.Zaehlernummer,
        'UPDATE',
        CURRENT_USER,
        CONCAT('Zählerstand geändert: ', OLD.Zaehlerstand, ' -> ', NEW.Zaehlerstand,
               ' am ', NEW.Datum)
    );
END$$

CREATE TRIGGER trg_verbrauchsdaten_delete
AFTER DELETE ON Verbrauchsdaten
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log(Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Verbrauchsdaten',
        OLD.Zaehlernummer,
        'DELETE',
        CURRENT_USER,
        CONCAT('Zählerstand gelöscht: ', OLD.Zaehlerstand, ' am ', OLD.Datum)
    );
END$$

-- ======================
-- Anlagen-Tabelle
-- ======================
CREATE TRIGGER trg_anlagen_insert
AFTER INSERT ON Anlagen
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log(Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Anlagen',
        NEW.AnlageID,
        'INSERT',
        CURRENT_USER,
        CONCAT('Neue Anlage: Name = ', NEW.Name, ', Typ = ', NEW.Typ, ', Status = ', NEW.Status)
    );
END$$

CREATE TRIGGER trg_anlagen_update
AFTER UPDATE ON Anlagen
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log(Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Anlagen',
        NEW.AnlageID,
        'UPDATE',
        CURRENT_USER,
        CONCAT('Anlage aktualisiert: Status ', OLD.Status, ' -> ', NEW.Status)
    );
END$$

CREATE TRIGGER trg_anlagen_delete
AFTER DELETE ON Anlagen
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log(Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Anlagen',
        OLD.AnlageID,
        'DELETE',
        CURRENT_USER,
        CONCAT('Anlage gelöscht: Name = ', OLD.Name)
    );
END$$

-- ======================
-- Wartungen-Tabelle
-- ======================
CREATE TRIGGER trg_wartungen_insert
AFTER INSERT ON Wartungen
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log(Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Wartungen',
        NEW.WartungID,
        'INSERT',
        CURRENT_USER,
        CONCAT('Neue Wartung für AnlageID ', NEW.AnlageID, ' am ', NEW.Wartungsdatum, ', Typ = ', NEW.Wartungstyp)
    );
END$$

CREATE TRIGGER trg_wartungen_update
AFTER UPDATE ON Wartungen
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log(Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Wartungen',
        NEW.WartungID,
        'UPDATE',
        CURRENT_USER,
        CONCAT('Wartung aktualisiert: Beschreibung ', OLD.Beschreibung, ' -> ', NEW.Beschreibung)
    );
END$$

CREATE TRIGGER trg_wartungen_delete
AFTER DELETE ON Wartungen
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log(Tabelle, DatensatzID, Aktion, Benutzer, Bemerkung)
    VALUES (
        'Wartungen',
        OLD.WartungID,
        'DELETE',
        CURRENT_USER,
        CONCAT('Wartung gelöscht: AnlageID = ', OLD.AnlageID, ', Datum = ', OLD.Wartungsdatum)
    );
END$$

DELIMITER ;
