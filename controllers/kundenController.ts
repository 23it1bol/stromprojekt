import { Kunde } from '../models/Kunde';

const kunden: Kunde[] = []; // Lokales Array als Dummy-Datenbank

export function getAllKunden(): Kunde[] {
  return kunden; // Gibt alle Kunden zurück
}

export function createKunde(data: Kunde): Kunde {
  const newKunde = { ...data, KundenID: kunden.length + 1 }; // ID automatisch vergeben
  kunden.push(newKunde); // In unser lokales Array speichern
  return newKunde;
}
