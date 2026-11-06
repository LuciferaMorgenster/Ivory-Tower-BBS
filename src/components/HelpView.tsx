/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { sound } from '../utils/sound';
import { Terminal, Shield, RefreshCw, Code, BookOpen, Search, Languages } from 'lucide-react';

export const HelpView: React.FC = () => {
  const [language, setLanguage] = useState<'nl' | 'en'>('nl');
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState('');

  const sectionsNl = [
    {
      id: 'intro',
      title: '1. Systeembeschrijving & Filosofie',
      icon: BookOpen,
      content: `De Ivory Tower BBS is een veerkrachtig, lokaal Bulletin Board System ontworpen voor dorpen, wijken, hacker-collectieven en noodcommunicatienetwerken.

Belangrijkste eigenschappen:
- VOLLEDIG OFFLINE-FIRST: Alle berichten, taken en sleutels worden opgeslagen in uw lokale browser-database (IndexedDB). U heeft geen actieve internetverbinding nodig om discussies te lezen of nieuwe berichten op te stellen.
- RETRO ANSI INTERFACE: Geoptimaliseerd voor een authentieke terminal-uitstraling met amber en groen fosfor, instelbare scanlijnen en 16-kleuren ANSI opmaak.
- END-TO-END ENCRYPTIE: Berichten op beveiligde kanalen worden lokaal versleuteld met AES-256-GCM. Alleen gebruikers met de geldige herstelwachtwoordzin kunnen meelezen.`,
    },
    {
      id: 'cli',
      title: '2. Commandoregel & Sneltoetsen',
      icon: Terminal,
      content: `U kunt het hele systeem bedienen via het toetsenbord door opdrachten in te voeren in de commandoregel (BBS>):

BESCHIKBARE COMMANDO'S:
- help              : Toon dit helpoverzicht
- tour / gids       : Open de interactieve startersgids en rondleiding
- boards            : Navigeer naar de discussieborden
- post              : Open het venster om een nieuw bericht te schrijven
- chat / packet     : Real-time packet radio en mesh terminal chat
- doors / trivia    : BBS door utilities, retro trivia en ANSI Art Studio
- files / xmodem    : Bestandenbibliotheek met XMODEM-CRC download
- tasks / agenda    : Open de gedeelde gemeenschapstaken en iCal (.ics)
- dashboard         : Toon data-analyse, grafieken en rapportages
- sync              : Synchroniseer uitgaande wachtrij met netwerknodes
- e2ee / crypto     : Open sleutelbeheer voor end-to-end encryptie
- security / mfa    : Beheer 2FA en biometrische authenticatie
- sysop / admin     : Systeembeheerdersconsole, audit-log en nooduitzending
- api               : Bekijk de externe REST API playground
- export            : Download een back-up of exporteer data
- theme <kleur>     : Schakel thema (amber, green, dos, dark, light)
- sound             : Schakel retro geluidseffecten in of uit
- scanlines         : Schakel het CRT-scanlijneffect in of uit

SNELTOETSEN:
- Pijltje Omhoog / Omlaag: Blader door eerdere opdrachten (geschiedenis)
- TAB: Automatische commando-aanvulling`,
    },
    {
      id: 'e2ee',
      title: '3. End-to-End Encryptie (E2EE)',
      icon: Shield,
      content: `HOE WERKT DE ENCRYPTIE?
1. Automatische Sleutelgeneratie: Bij uw eerste bezoek genereert de browser automatisch een cryptografisch sleutelpaar en een 12-woorden herstelzin (bijv. "amber modem cipher matrix...").
2. Sleutelafleiding: Via PBKDF2 met 100.000 iteraties en SHA-256 wordt hieruit een 256-bits AES-GCM sleutel berekend.
3. Lokale Versleuteling: Zodra u een versleuteld bericht verzendt, wordt de tekst met een unieke 12-byte IV en 16-byte salt versleuteld in de browser. Alleen nodes met dezelfde herstelzin kunnen het bericht ontsleutelen.
4. Back-up: Bewaar uw 12 woorden zorgvuldig. Zonder deze woorden kan niemand (ook niet de SysOp) verloren berichten herstellen.`,
    },
    {
      id: 'sync',
      title: '4. Offline Synchronisatie & Conflicten',
      icon: RefreshCw,
      content: `NETWERKEN MET ONDERBREKINGEN:
- Uitgaande Wachtrij (Outbox): Alle acties die u offline uitvoert, worden veilig opgeslagen in IndexedDB en gemarkeerd als 'pending'.
- Automatische Herverbinding: Zodra het netwerk (WiFi, LoRa, of Ethernet) weer beschikbaar is, verzendt de sync-engine automatisch de wachtende data.
- Conflictresolutie: Indien twee nodes hetzelfde bericht op verschillende tijdstippen hebben gewijzigd, opent automatisch de conflictresolutie-interface. U kunt kiezen voor:
  * Behoud Lokaal: Uw versie overschrijft de inkomende versie.
  * Gebruik Remote: De binnengekomen versie wordt overgenomen.
  * Samenvoegen (Merge): Beide teksten worden gecombineerd met bronvermelding.`,
    },
    {
      id: 'api',
      title: '5. Externe Client REST API',
      icon: Code,
      content: `INTEGRATIE MET EXTERNE APPARATUUR:
Externe clients (zoals Python LoRa gateways, mobiele apps of command-line tools) kunnen via JSON communiceren:
- GET /api/bbs/boards : Lijst van discussiekanalen
- GET /api/bbs/posts  : Berichten en discussies opvragen
- POST /api/bbs/posts : Automatisch sensorgegevens of berichten posten
- GET /api/bbs/stats  : Telemetrie en opslagvolume

Zie het tabblad [API CLIENT] voor werkende interactieve voorbeelden en copy-paste cURL snippets.`,
    },
  ];

  const sectionsEn = [
    {
      id: 'intro',
      title: '1. System Overview & Philosophy',
      icon: BookOpen,
      content: `The Ivory Tower BBS is a resilient, local Bulletin Board System designed for neighborhood coordination, local associations, and off-grid emergency communications.

Key highlights:
- 100% OFFLINE-FIRST: All posts, tasks, and crypto keys are persistently stored in your browser's IndexedDB. No internet connection is required to read discussions or compose drafts.
- RETRO ANSI INTERFACE: Authentic CRT green and amber phosphor styling with toggleable scanlines and full ANSI 16-color code support.
- END-TO-END ENCRYPTION: Sensitive discussion channels are encrypted locally in your browser using AES-256-GCM. Only nodes with the matching mnemonic recovery phrase can decrypt content.`,
    },
    {
      id: 'cli',
      title: '2. Command-Line Reference & Shortcuts',
      icon: Terminal,
      content: `You can operate the entire system via keyboard commands entered at the BBS> prompt:

COMMANDS:
- help              : Show this help manual
- boards            : Navigate to discussion boards
- post              : Open post composer
- tasks             : Open shared community tasks
- dashboard         : View analytics, graphs, and export
- sync              : Synchronize outbox queue with peers
- e2ee              : Manage encryption keys and recovery phrase
- security / mfa    : Manage 2FA TOTP and biometric authentication
- api               : Open external REST API client playground
- export            : Download backup archive or CSV report
- theme amber/green : Switch CRT phosphor color
- sound             : Toggle retro audio feedback

SHORTCUTS:
- Arrow Up / Down: Command history
- TAB: Auto-complete command names`,
    },
    {
      id: 'e2ee',
      title: '3. End-to-End Encryption (E2EE)',
      icon: Shield,
      content: `HOW THE CIPHER SUITE WORKS:
1. Automatic Key Generation: A 12-word mnemonic recovery phrase is generated via Web Crypto API.
2. Key Derivation: PBKDF2 derives a 256-bit AES-GCM key with 100,000 iterations and SHA-256.
3. Zero-Knowledge: Message content never leaves your browser unencrypted.
4. Fingerprint: Cryptographic SHA-256 fingerprint allows visual identity verification between peers.`,
    },
    {
      id: 'sync',
      title: '4. Offline Sync & Conflict Resolution',
      icon: RefreshCw,
      content: `DEALING WITH INTERMITTENT CONNECTIVITY:
- Outbox Queue: Changes made while offline are staged in IndexedDB.
- Peer Sync: When connection is restored, pending changes are pushed in sequence.
- 3-Way Merge: Concurrent conflicts allow keeping local, adopting remote, or merging both versions side-by-side.`,
    },
    {
      id: 'api',
      title: '5. External Client REST API',
      icon: Code,
      content: `INTEGRATING WITH EXTERNAL NODES:
Automate data transfer from LoRa gateways or custom terminal hardware using standard JSON endpoints. Visit the [API CLIENT] tab for interactive sandboxes and cURL examples.`,
    },
  ];

  const sections = language === 'nl' ? sectionsNl : sectionsEn;

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="border border-inherit/40 p-3 bg-inherit/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>GEBRUIKERSHANDLEIDING & SYSOP HANDBOEK</span>
          </h2>
          <p className="opacity-70 mt-0.5 text-[11px]">
            Gedetailleerde uitleg over terminal-opdrachten, ANSI opmaak, E2EE encryptie en offline werking.
          </p>
        </div>

        {/* Language switch */}
        <div className="flex items-center gap-2">
          <Languages className="w-3.5 h-3.5 opacity-60" />
          <button
            onClick={() => {
              sound.keyClick();
              setLanguage('nl');
            }}
            className={`px-2 py-1 border text-xs ${
              language === 'nl' ? 'bg-current text-black font-bold' : 'border-inherit/30'
            }`}
          >
            NEDERLANDS
          </button>
          <button
            onClick={() => {
              sound.keyClick();
              setLanguage('en');
            }}
            className={`px-2 py-1 border text-xs ${
              language === 'en' ? 'bg-current text-black font-bold' : 'border-inherit/30'
            }`}
          >
            ENGLISH
          </button>
        </div>
      </div>

      {/* Manual Content Accordion/Sections */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Navigation Sidebar */}
        <div className="md:col-span-4 border border-inherit/40 p-3 bg-black/30 space-y-1.5">
          <div className="font-bold border-b border-inherit/30 pb-1 opacity-75 text-[11px]">
            HOOFDSTUKKEN:
          </div>
          {sections.map(sec => {
            const isSel = activeSection === sec.id;
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  sound.keyClick();
                  setActiveSection(sec.id);
                }}
                className={`w-full text-left p-2 border transition-colors flex items-center gap-2 ${
                  isSel
                    ? 'border-current bg-current/15 font-bold'
                    : 'border-inherit/20 hover:border-inherit/50 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5 opacity-75 shrink-0" />
                <span className="truncate">{sec.title}</span>
              </button>
            );
          })}
        </div>

        {/* Section Content */}
        <div className="md:col-span-8 border border-inherit/40 p-4 bg-black/40 space-y-3">
          {sections
            .filter(sec => sec.id === activeSection)
            .map(sec => (
              <div key={sec.id} className="space-y-3">
                <h3 className="text-sm font-bold border-b border-inherit/30 pb-2">
                  {sec.title}
                </h3>
                {sec.id === 'intro' && (
                  <div className="border border-inherit/40 overflow-hidden my-2">
                    <img
                      src="/src/assets/images/bbs_cover_banner_1793987776327.jpg"
                      alt="Ivory Tower BBS"
                      className="w-full h-48 sm:h-56 object-cover opacity-90 contrast-125"
                      loading="lazy"
                    />
                  </div>
                )}
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed opacity-90">
                  {sec.content}
                </pre>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
