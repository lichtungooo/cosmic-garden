// Helper: liefert einen anzeigbaren Pseudonym-Namen fuer eine Profil-ID.
// - Eigene ID  → currentUser.displayName
// - Kontakt-ID → contact.displayName
// - Sonst      → "Gaertner #" + ID-Suffix (6 Stellen)

import { useMemo } from 'react';
import { useCurrentUser, useContacts } from '@real-life-stack/toolkit';

export function useProfilName(profilId: string | undefined | null): string {
  const { data: currentUser } = useCurrentUser();
  const { activeContacts } = useContacts();

  return useMemo(() => {
    if (!profilId || profilId === 'anonym') return 'Gärtner ohne Namen';
    if (currentUser?.id === profilId) {
      return currentUser.displayName?.trim() || `Gärtner #${profilId.slice(-6)}`;
    }
    const contact = activeContacts.find(c => c.id === profilId);
    if (contact) {
      return contact.name?.trim() || `Gärtner #${profilId.slice(-6)}`;
    }
    return `Gärtner #${profilId.slice(-6)}`;
  }, [profilId, currentUser?.id, currentUser?.displayName, activeContacts]);
}
