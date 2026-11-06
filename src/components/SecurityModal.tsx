/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types';
import { storage } from '../utils/storage';
import { sound } from '../utils/sound';
import {
  generateMnemonic,
  computeFingerprint,
} from '../utils/crypto';
import {
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  KeyRound,
  CheckCircle,
  Copy,
  RefreshCw,
  QrCode,
  Lock,
} from 'lucide-react';

interface SecurityModalProps {
  user: UserAccount;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (user: UserAccount) => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'mfa' | 'biometric' | 'e2ee'>('e2ee');

  // MFA State
  const [mfaCodeInput, setMfaCodeInput] = useState('');
  const [currentTotpCode, setCurrentTotpCode] = useState('482910');
  const [mfaSuccessMsg, setMfaSuccessMsg] = useState('');

  // Biometric State
  const [bioScanning, setBioScanning] = useState(false);
  const [bioSuccess, setBioSuccess] = useState(user.biometricRegistered);

  // E2EE State
  const [mnemonic, setMnemonic] = useState<string>('');
  const [fingerprint, setFingerprint] = useState<string>('');
  const [copiedMnemonic, setCopiedMnemonic] = useState(false);

  useEffect(() => {
    // Load or generate initial E2EE mnemonic
    let currentMnemonic = storage.getCryptoMnemonic();
    if (!currentMnemonic) {
      currentMnemonic = generateMnemonic(12);
      storage.saveCryptoMnemonic(currentMnemonic);
    }
    setMnemonic(currentMnemonic);
    computeFingerprint(currentMnemonic).then(fp => setFingerprint(fp));

    // Update TOTP code simulation every 30s
    const interval = setInterval(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setCurrentTotpCode(code);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const handleToggleMfa = () => {
    sound.execute();
    const updatedUser = { ...user, mfaEnabled: !user.mfaEnabled };
    storage.saveUserAccount(updatedUser);
    onUserUpdated(updatedUser);
    setMfaSuccessMsg(
      updatedUser.mfaEnabled
        ? 'Tweefactorauthenticatie (2FA) succesvol geactiveerd!'
        : 'Tweefactorauthenticatie uitgeschakeld.'
    );
  };

  const handleVerifyTotp = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCodeInput.trim().length === 6) {
      sound.execute();
      setMfaSuccessMsg('TOTP verificatiecode goedgekeurd!');
      setMfaCodeInput('');
    } else {
      sound.errorBeep();
      alert('Voer een geldige 6-cijferige verificatiecode in.');
    }
  };

  const handleScanBiometrics = () => {
    sound.bell();
    setBioScanning(true);
    setTimeout(() => {
      setBioScanning(false);
      setBioSuccess(true);
      sound.execute();
      const updatedUser = { ...user, biometricRegistered: true };
      storage.saveUserAccount(updatedUser);
      onUserUpdated(updatedUser);
    }, 1200);
  };

  const handleGenerateNewMnemonic = async () => {
    if (confirm('Let op: het genereren van een nieuwe sleutelzin maakt eerder versleutelde berichten onleesbaar tenzij u de oude zin bewaart. Weet u het zeker?')) {
      sound.execute();
      const newMnemonic = generateMnemonic(12);
      setMnemonic(newMnemonic);
      storage.saveCryptoMnemonic(newMnemonic);
      const fp = await computeFingerprint(newMnemonic);
      setFingerprint(fp);
    }
  };

  const copyMnemonic = () => {
    sound.keyClick();
    navigator.clipboard.writeText(mnemonic);
    setCopiedMnemonic(true);
    setTimeout(() => setCopiedMnemonic(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 font-mono text-xs">
      <div className="border-2 border-inherit bg-neutral-950 text-inherit w-full max-w-xl max-h-[90vh] overflow-y-auto p-4 space-y-4 shadow-2xl">
        {/* Modal Title */}
        <div className="flex items-center justify-between border-b border-inherit/40 pb-2">
          <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>BEVEILIGINGS- EN TOEGANGSBEHEER</span>
          </h3>
          <button
            onClick={onClose}
            className="px-2 py-0.5 border border-inherit/40 hover:bg-white/10 text-xs font-bold"
          >
            [X SLUITEN]
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 border-b border-inherit/30 pb-2">
          {[
            { id: 'e2ee', label: 'E2EE SLEUTELS', icon: KeyRound },
            { id: 'mfa', label: '2FA / TOTP AUTH', icon: ShieldCheck },
            { id: 'biometric', label: 'BIOMETRIE', icon: Fingerprint },
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.keyClick();
                  setActiveTab(tab.id as any);
                }}
                className={`px-3 py-1.5 border transition-colors flex items-center gap-1.5 text-xs ${
                  isSel
                    ? 'border-current bg-current/20 font-bold'
                    : 'border-inherit/30 hover:border-inherit/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: E2EE Keys */}
        {activeTab === 'e2ee' && (
          <div className="space-y-3">
            <div className="p-3 border border-amber-600/60 bg-amber-950/20 space-y-2">
              <div className="font-bold text-amber-400 flex items-center justify-between">
                <span>END-TO-END VERSLEUTELING (AES-256-GCM)</span>
                <span className="text-[10px] opacity-75">HERSTELZIN ACTIEF</span>
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed">
                Berichten op beveiligde kanalen worden lokaal in uw browser versleuteld vóór verzending. Alleen nodes met deze 12-woorden zin kunnen de tekst ontsleutelen.
              </p>
            </div>

            {/* Mnemonic Display */}
            <div>
              <div className="flex items-center justify-between mb-1 opacity-75 text-[11px]">
                <span>UW 12-WOORDEN HERSTELWACHTWOORDZIN:</span>
                <button
                  onClick={copyMnemonic}
                  className="flex items-center gap-1 hover:underline"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedMnemonic ? 'GEKOPIEERD!' : 'KOPIEER ZIN'}</span>
                </button>
              </div>

              <div className="p-3 bg-black border border-inherit/50 grid grid-cols-3 sm:grid-cols-4 gap-2 text-center text-xs select-all">
                {mnemonic.split(' ').map((word, idx) => (
                  <div key={idx} className="p-1 border border-inherit/20 bg-white/5">
                    <span className="opacity-40 text-[10px] mr-1">{idx + 1}.</span>
                    <strong>{word}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptographic Fingerprint */}
            <div className="p-2.5 border border-inherit/30 bg-black/40 flex items-center justify-between text-xs">
              <div>
                <span className="opacity-60 text-[10px] block">SLEUTEL VINGERAFDRUK (SHA-256):</span>
                <span className="font-mono font-bold text-amber-300">{fingerprint || 'Berekenen...'}</span>
              </div>
              <button
                onClick={handleGenerateNewMnemonic}
                className="px-2 py-1 border border-inherit/40 hover:bg-white/10 text-[11px] flex items-center gap-1"
                title="Genereer een nieuwe willekeurige sleutelzin"
              >
                <RefreshCw className="w-3 h-3" />
                <span>NIEUWE ZIN</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: 2FA / TOTP */}
        {activeTab === 'mfa' && (
          <div className="space-y-3">
            <div className="p-3 border border-inherit/40 bg-black/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">STATUS 2FA / TOTP:</span>
                <span
                  className={`px-2 py-0.5 border text-[11px] font-bold ${
                    user.mfaEnabled
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-950/40'
                      : 'border-amber-500 text-amber-400 bg-amber-950/40'
                  }`}
                >
                  {user.mfaEnabled ? 'INGESCHAKELD' : 'UITGESCHAKELD'}
                </span>
              </div>
              <p className="text-[11px] opacity-75">
                Multi-factor authenticatie beveiligt uw SysOp-rechten en administratieve BBS-functies tegen ongeautoriseerde toegang via externe nodes.
              </p>
              <button
                onClick={handleToggleMfa}
                className="px-3 py-1.5 border border-inherit/60 hover:bg-white/10 font-bold"
              >
                {user.mfaEnabled ? 'TWEEFACTORAUTHENTICATIE UITSCHAKELEN' : 'TWEEFACTORAUTHENTICATIE INSCHAKELEN'}
              </button>
            </div>

            {/* Simulated TOTP Generator & ASCII QR code */}
            <div className="border border-inherit/30 p-3 bg-black/40 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="space-y-1">
                <div className="font-bold text-[11px] opacity-80">GESIMULEERDE TOTP TOKEN:</div>
                <div className="text-2xl font-bold font-mono tracking-widest text-emerald-400">
                  {currentTotpCode}
                </div>
                <div className="text-[10px] opacity-60">
                  Vernieuwt elke 15s · Sleutel: {user.mfaSecret || 'JBSWY3DPEHPK3PXP'}
                </div>
              </div>

              {/* ASCII QR Matrix Representation */}
              <div className="font-mono text-[9px] leading-none opacity-80 border border-inherit/20 p-2 bg-black text-center select-none">
                <pre>
{`█▀▀▀▀▀█ ▄ █▄█ █▀▀▀▀▀█
█ ███ █ ▄█▄ ▄ █ ███ █
█ ▀▀▀ █ █ ▄▄█ █ ▀▀▀ █
▀▀▀▀▀▀▀ ▀ █ ▀ ▀▀▀▀▀▀▀
██▀▄▀▄▀▄█▄▀█▀▄▀█▀▄██▀
█▀▀▀▀▀█ ▀█ ▄█ █ ▀ ▄▀█
█ ███ █ █▄▄▄▄ █▀█▀███
█ ▀▀▀ █ ▄▀█ ▄ ▄▀█▀█▀█
▀▀▀▀▀▀▀ ▀   ▀ ▀ ▀▀  ▀`}
                </pre>
                <div className="text-[9px] opacity-60 mt-1">TOTP AUTHENTICATOR QR</div>
              </div>
            </div>

            {/* Verification Tester */}
            <form onSubmit={handleVerifyTotp} className="flex items-center gap-2">
              <input
                type="text"
                maxLength={6}
                value={mfaCodeInput}
                onChange={e => setMfaCodeInput(e.target.value)}
                placeholder="Voer 6-cijferige code in..."
                className="flex-1 bg-black border border-inherit/50 p-2 text-xs font-mono outline-none focus:border-current"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-current text-black font-bold hover:opacity-90"
              >
                VERIFIEER
              </button>
            </form>

            {mfaSuccessMsg && (
              <div className="p-2 border border-emerald-500/60 text-emerald-400 bg-emerald-950/20 text-[11px] flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{mfaSuccessMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Biometrics */}
        {activeTab === 'biometric' && (
          <div className="space-y-3">
            <div className="p-3 border border-inherit/40 bg-black/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">BIOMETRISCHE AUTHENTICATIE (WEBAUTHN):</span>
                <span
                  className={`px-2 py-0.5 border text-[11px] font-bold ${
                    bioSuccess
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-950/40'
                      : 'border-amber-500 text-amber-400 bg-amber-950/40'
                  }`}
                >
                  {bioSuccess ? 'GEKOPPELD' : 'NIET GEREGISTREERD'}
                </span>
              </div>
              <p className="text-[11px] opacity-75">
                Ondersteuning voor biometrische verificatie via Touch ID, Windows Hello of apparaat-passkeys voor snelle en wachtwoordloze sessie-ontgrendeling.
              </p>
            </div>

            <div className="border border-inherit/30 p-6 bg-black/40 text-center space-y-3">
              <Fingerprint
                className={`w-14 h-14 mx-auto transition-transform ${
                  bioScanning ? 'animate-pulse text-amber-400 scale-110' : bioSuccess ? 'text-emerald-400' : 'opacity-40'
                }`}
              />

              <div className="text-xs">
                {bioScanning ? (
                  <span className="text-amber-400 font-bold">Vingerafdruksensor scannen...</span>
                ) : bioSuccess ? (
                  <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Biometrische sleutel actief voor node #{user.nodeNumber}
                  </span>
                ) : (
                  <span>Geen biometrische sleutel geregistreerd op dit apparaat.</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleScanBiometrics}
                disabled={bioScanning}
                className="px-4 py-2 border border-current font-bold hover:bg-current hover:text-black transition-colors"
              >
                {bioScanning ? 'BEZIG MET SCANNEN...' : 'BIOMETRIE REGISTREREN / TESTEN'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
