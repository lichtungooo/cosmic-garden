// Connector-Singleton für cosmic-garden.
// Hooks (useConnector, useItems, useCurrentUser, useCreateItem usw.) kommen direkt
// aus @real-life-stack/toolkit — wir bauen nichts eigenes drueber.

import { WotConnector } from '@real-life-stack/wot-connector';

let connectorPromise: Promise<WotConnector> | null = null;

export function getConnector(): Promise<WotConnector> {
  if (!connectorPromise) {
    connectorPromise = (async () => {
      const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
      const c = new WotConnector({
        relayUrl: env.VITE_RELAY_URL ?? 'wss://relay.utopia-lab.org',
        profilesUrl: env.VITE_PROFILE_SERVICE_URL ?? 'https://profiles.utopia-lab.org',
        vaultUrl: env.VITE_VAULT_URL ?? 'https://vault.utopia-lab.org',
      });
      await c.init();
      return c;
    })();
  }
  return connectorPromise;
}
