// Lokale User-ID — eine zufaellige Kennung pro Browser/Geraet.
// Spaeter ersetzbar durch echte Identitaet aus dem Real Life Network.

const SCHLUESSEL = 'garten.user.id';
const NAME_SCHLUESSEL = 'garten.user.name';

function neueId(): string {
  return `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nutzerId(): string {
  if (typeof localStorage === 'undefined') return 'anonym';
  let id = localStorage.getItem(SCHLUESSEL);
  if (!id) {
    id = neueId();
    try { localStorage.setItem(SCHLUESSEL, id); } catch { /* leise */ }
  }
  return id;
}

export function nutzerName(): string {
  if (typeof localStorage === 'undefined') return 'Anonym';
  return localStorage.getItem(NAME_SCHLUESSEL) ?? 'Anonym';
}

export function setzeNutzerName(name: string): void {
  if (typeof localStorage === 'undefined') return;
  const sauber = name.trim().slice(0, 40);
  if (sauber) {
    localStorage.setItem(NAME_SCHLUESSEL, sauber);
  } else {
    localStorage.removeItem(NAME_SCHLUESSEL);
  }
}
