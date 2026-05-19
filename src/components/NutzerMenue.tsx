// Nutzer-Knopf rechts oben.
// - Nicht angemeldet: zeigt "Anmelden"-Knopf, klick öffnet Anmelde-Schirm.
// - Angemeldet: zeigt Avatar/Kürzel, klick führt zur Profil-Seite.
// Dazu: Contacts- + Verification-Dialoge plus IncomingEvents (laufen nur,
// wenn angemeldet).

import { useEffect } from 'react';
import {
  ContactsDialog,
  VerificationDialog,
  IncomingVerificationDialog,
  IncomingSpaceInviteDialog,
  MutualVerificationDialog,
  useConnector,
  useCurrentUser,
  useContacts,
  useVerification,
  useIncomingEvents,
} from '@real-life-stack/toolkit';
import { hasSignedClaims } from '@real-life-stack/data-interface';

interface Props {
  istAngemeldet: boolean;
  onAnmelden: () => void;
  onProfil: () => void;
  kontakteOffen: boolean;
  setKontakteOffen: (v: boolean) => void;
  verifyOffen: boolean;
  setVerifyOffen: (v: boolean) => void;
}

export function NutzerMenue({
  istAngemeldet,
  onAnmelden,
  onProfil,
  kontakteOffen,
  setKontakteOffen,
  verifyOffen,
  setVerifyOffen,
}: Props) {
  if (!istAngemeldet) {
    return (
      <button className="anmelden-knopf" onClick={onAnmelden}>
        Anmelden
      </button>
    );
  }

  return (
    <AngemeldetMenue
      onProfil={onProfil}
      kontakteOffen={kontakteOffen}
      setKontakteOffen={setKontakteOffen}
      verifyOffen={verifyOffen}
      setVerifyOffen={setVerifyOffen}
    />
  );
}

function AngemeldetMenue({
  onProfil, kontakteOffen, setKontakteOffen, verifyOffen, setVerifyOffen,
}: Omit<Props, 'istAngemeldet' | 'onAnmelden'>) {
  const connector = useConnector();
  const { data: currentUser } = useCurrentUser();
  const { activeContacts, pendingContacts, removeContact, updateContactName } = useContacts();
  const verification = useVerification();

  const angezeigterName = currentUser?.displayName ?? (currentUser?.id ? currentUser.id.slice(-6) : '');
  const kuerzel = (currentUser?.displayName ?? currentUser?.id ?? '?').slice(0, 2).toUpperCase();

  return (
    <>
      <button
        className="nutzer-menue"
        onClick={onProfil}
        aria-label="Mein Profil"
        title={angezeigterName}
      >
        {currentUser?.avatarUrl ? (
          <img src={currentUser.avatarUrl} alt="" className="nutzer-avatar" />
        ) : (
          <span className="nutzer-kuerzel">{kuerzel}</span>
        )}
      </button>

      <ContactsDialog
        open={kontakteOffen}
        onOpenChange={setKontakteOffen}
        activeContacts={activeContacts}
        pendingContacts={pendingContacts}
        onRemove={removeContact}
        onEditName={updateContactName}
        onVerify={() => {
          setKontakteOffen(false);
          setVerifyOffen(true);
        }}
      />

      <VerificationDialog
        open={verifyOffen}
        onOpenChange={setVerifyOffen}
        challenge={verification.challenge}
        peerInfo={verification.peerInfo}
        isProcessing={verification.isProcessing}
        error={verification.error}
        onCreateChallenge={verification.createChallenge}
        onScanChallenge={verification.scanChallenge}
        onConfirmVerification={verification.confirmVerification}
        onReset={verification.reset}
      />

      <IncomingEventDialogs onCloseVerifyDialog={() => setVerifyOffen(false)} />
      <span style={{ display: 'none' }}>{String(connector !== null)}{String(hasSignedClaims(connector))}</span>
    </>
  );
}

function IncomingEventDialogs({ onCloseVerifyDialog }: { onCloseVerifyDialog?: () => void }) {
  const connector = useConnector();
  const { data: currentUser } = useCurrentUser();
  const { incomingVerification, spaceInvite, mutualVerification, dismiss } = useIncomingEvents();

  const handleCounterVerify = async () => {
    if (!incomingVerification || !hasSignedClaims(connector)) return;
    await connector.counterVerify(incomingVerification.fromId);
    dismiss();
  };

  useEffect(() => {
    if (incomingVerification || mutualVerification) onCloseVerifyDialog?.();
  }, [incomingVerification, mutualVerification, onCloseVerifyDialog]);

  return (
    <>
      <IncomingVerificationDialog
        open={!!incomingVerification}
        fromId={incomingVerification?.fromId ?? ''}
        fromName={incomingVerification?.fromName}
        fromAvatar={incomingVerification?.fromAvatar}
        onConfirm={handleCounterVerify}
        onReject={dismiss}
      />
      <IncomingSpaceInviteDialog
        open={!!spaceInvite}
        spaceName={spaceInvite?.spaceName ?? ''}
        spaceImage={spaceInvite?.spaceImage}
        inviterName={spaceInvite?.fromName}
        onOpen={dismiss}
        onDismiss={dismiss}
      />
      <MutualVerificationDialog
        open={!!mutualVerification}
        peerName={mutualVerification?.fromName}
        peerAvatar={mutualVerification?.fromAvatar}
        myName={currentUser?.displayName}
        myAvatar={currentUser?.avatarUrl}
        onDismiss={dismiss}
      />
    </>
  );
}
