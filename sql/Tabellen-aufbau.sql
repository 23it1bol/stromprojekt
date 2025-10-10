-- ========================================
-- Datenbankstruktur für Stromkraftwerk
-- Autor: Gabriel
-- Erstellt: 26.09.25
-- Beschreibung: Kunden-, Zähler-, Verbrauchs- und Anlagendaten
-- ========================================

-- Kunden-Tabelle
CREATE TABLE Kunden (
    KundenID INT AUTO_INCREMENT PRIMARY KEY,
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

-- Änderungsprotokoll (für GoBD / Audit Trail)
CREATE TABLE Audit_Log (
    LogID INT PRIMARY KEY,
    Tabelle VARCHAR(50),
    DatensatzID INT,
    Aktion VARCHAR(10), -- z. B. 'INSERT', 'UPDATE', 'DELETE'
    Aenderungsdatum TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Benutzer VARCHAR(50),
    Bemerkung TEXT
);

-- Beispiel: Trigger können später verwendet werden, um Audit-Log zu füllen