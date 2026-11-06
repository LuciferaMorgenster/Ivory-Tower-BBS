/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// BIP39-compatible subset of retro-flavored cryptographic seed words
const MNEMONIC_WORDS = [
  'amber', 'modem', 'matrix', 'cipher', 'vector', 'pixel', 'packet', 'terminal',
  'binary', 'buffer', 'copper', 'daemon', 'device', 'escape', 'floppy', 'gateway',
  'hacker', 'header', 'kernel', 'legacy', 'memory', 'monochrome', 'network', 'opcode',
  'parity', 'phosphor', 'quantum', 'raster', 'router', 'schema', 'sector', 'serial',
  'socket', 'subnet', 'switch', 'syntax', 'telecom', 'toggle', 'tunnel', 'vortex',
  'wire', 'zenith', 'beacon', 'crypto', 'shield', 'vault', 'anchor', 'frost',
  'cascade', 'echo', 'flux', 'glitch', 'iron', 'lumen', 'nexus', 'pulse'
];

export interface CryptoKeyPairRecord {
  mnemonic: string;
  fingerprint: string;
  createdAt: string;
}

/**
 * Generates a random 12-word recovery mnemonic passphrase.
 */
export function generateMnemonic(wordCount = 12): string {
  const words: string[] = [];
  const randomBuffer = new Uint32Array(wordCount);
  window.crypto.getRandomValues(randomBuffer);

  for (let i = 0; i < wordCount; i++) {
    const index = randomBuffer[i] % MNEMONIC_WORDS.length;
    words.push(MNEMONIC_WORDS[index]);
  }
  return words.join(' ');
}

/**
 * Derives an AES-GCM 256-bit CryptoKey from a mnemonic or passphrase via PBKDF2.
 */
async function deriveKeyFromPassphrase(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase.trim().toLowerCase()),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Computes a human-readable hex fingerprint from a mnemonic.
 */
export async function computeFingerprint(mnemonic: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(mnemonic.trim().toLowerCase()));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  // Formatted like BBS-XXXX-XXXX-XXXX
  return `BBS-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

/**
 * Encrypts plain text into an envelope string: Base64(salt + iv + ciphertext).
 */
export async function encryptMessage(plainText: string, mnemonic: string): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassphrase(mnemonic, salt);

  const enc = new TextEncoder();
  const encodedText = enc.encode(plainText);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedText
  );

  // Combine: salt (16 bytes) + iv (12 bytes) + ciphertext
  const combined = new Uint8Array(salt.byteLength + iv.byteLength + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(new Uint8Array(ciphertext), salt.byteLength + iv.byteLength);

  // Convert to Base64
  let binary = '';
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

/**
 * Decrypts an envelope string: Base64(salt + iv + ciphertext) back into plain text.
 */
export async function decryptMessage(encryptedPayload: string, mnemonic: string): Promise<string> {
  try {
    const binary = atob(encryptedPayload);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    if (combined.length < 28) {
      throw new Error('Payload too short');
    }

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    const key = await deriveKeyFromPassphrase(mnemonic, salt);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    return `[DECRYPTIE FOUT: Ongeldige sleutel of beschadigd bericht]`;
  }
}
