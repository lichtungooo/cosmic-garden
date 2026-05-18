import { createContext, useContext } from 'react';

export type OeffneWissenFn = (sektionId: string, eintragId: string) => void;

export const WissenContext = createContext<OeffneWissenFn | null>(null);

export function useOeffneWissen(): OeffneWissenFn | null {
  return useContext(WissenContext);
}
