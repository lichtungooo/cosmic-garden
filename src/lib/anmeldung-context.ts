// Globaler Hook, mit dem tief verschachtelte Komponenten den Anmelde-Schirm
// oeffnen koennen (statt props durchzureichen).
import { createContext, useContext } from 'react';

export interface AnmeldungContextWert {
  oeffne: () => void;
}

export const AnmeldungContext = createContext<AnmeldungContextWert>({
  oeffne: () => {},
});

export function useAnmeldung() {
  return useContext(AnmeldungContext);
}
