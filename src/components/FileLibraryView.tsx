/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { sound } from '../utils/sound';
import { Download, Upload, FileText, CheckCircle, HardDrive, Terminal } from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  description: string;
  sizeKb: number;
  category: 'manual' | 'mesh' | 'emergency' | 'tool';
  uploader: string;
  downloads: number;
  date: string;
  content: string;
}

const INITIAL_FILES: FileItem[] = [
  {
    id: 'f-1',
    name: 'NOODFREQUENTIES_NL_2026.TXT',
    description: 'Overzicht van lokale nood-, repeaters- en PMR446/LPD kanalen in de regio.',
    sizeKb: 14.2,
    category: 'emergency',
    uploader: 'Bastard Operator From Hell (BOFH)',
    downloads: 48,
    date: '2026-11-01',
    content: `===================================================================
LOKALE NOODCOMMUNICATIE FREQUENTIETABEL REGIO UTRECHT/GELDERLAND
===================================================================
1. PMR446 Kanaal 1 (446.00625 MHz) - Buurt Noodkanaal
2. PMR446 Kanaal 8 (446.09375 MHz) - Algemene Oproep
3. Meshtastic LoRa: 869.525 MHz / Bandbreedte 250kHz / CR 4/8 (LongFast)
4. Packet Radio 2-meter: 144.800 MHz (APRS) / 144.850 MHz (BBS Node #1)
5. 70cm Repeater PI2NOS: 430.125 MHz (+1.6 MHz shift / 77.0 Hz CTCSS)`,
  },
  {
    id: 'f-2',
    name: 'MESHTASTIC_GATEWAY_CONFIG.YAML',
    description: 'Kant-en-klare YAML configuratie voor ESP32 LoRa nodes met veilige PSK sleutels.',
    sizeKb: 8.5,
    category: 'mesh',
    uploader: 'Kees_Mesh',
    downloads: 32,
    date: '2026-11-03',
    content: `owner: "Wijkpost-Node-1"
channel_url: "meshtastic://AQEB..."
lora:
  region: "EU_868"
  modem_preset: "LONG_FAST"
  hop_limit: 5
  tx_power: 20
bluetooth:
  enabled: true
device:
  role: "ROUTER_CLIENT"`,
  },
  {
    id: 'f-3',
    name: 'ACCU_ONDERHOUD_ENERGIE_CHECKLIST.MD',
    description: 'Inspectielijst voor lood-gel en LiFePO4 zonne-accubanken bij langdurige stroomuitval.',
    sizeKb: 22.0,
    category: 'emergency',
    uploader: 'Anouk_K',
    downloads: 19,
    date: '2026-10-28',
    content: `# Noodstroom & Batterijbank Inspectie

1. Controleer klemspanning: > 13.2V (in rust) duidt op volle lading.
2. Zorg voor voldoende ventilatie tegen waterstofgasvorming bij bulklading.
3. Test de omvormer met een 200W testbelasting gedurende 15 minuten.
4. Reinig de aansluitpolen met vaseline ter preventie van sulfatering.`,
  },
  {
    id: 'f-4',
    name: 'BBS_REST_CLIENT_EXAMPLE.PY',
    description: 'Python script voor automatische telemetrie-uitlezing en posten op de BBS.',
    sizeKb: 5.1,
    category: 'tool',
    uploader: 'Bastard Operator From Hell (BOFH)',
    downloads: 65,
    date: '2026-11-04',
    content: `import requests
import json

API_URL = "http://localhost:3000/api/bbs"
res = requests.get(f"{API_URL}/stats")
print("BBS Telemetrie:", json.dumps(res.json(), indent=2))`,
  },
];

export const FileLibraryView: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>(INITIAL_FILES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [transferringFile, setTransferringFile] = useState<FileItem | null>(null);
  const [transferProgress, setTransferProgress] = useState(0);
  const [transferBlock, setTransferBlock] = useState(0);

  const filteredFiles = files.filter(f => {
    if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
    return true;
  });

  const startXmodemDownload = (file: FileItem) => {
    sound.execute();
    setTransferringFile(file);
    setTransferProgress(0);
    setTransferBlock(0);

    const totalBlocks = Math.max(16, Math.round(file.sizeKb * 4));
    let current = 0;

    const interval = setInterval(() => {
      current++;
      setTransferBlock(current);
      setTransferProgress(Math.round((current / totalBlocks) * 100));

      if (current % 4 === 0) {
        sound.keyClick();
      }

      if (current >= totalBlocks) {
        clearInterval(interval);
        sound.bell();
        setTimeout(() => {
          // Trigger actual download of content as text/plain
          const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          // Update downloads count
          setFiles(prev =>
            prev.map(f => (f.id === file.id ? { ...f, downloads: f.downloads + 1 } : f))
          );
          setTransferringFile(null);
        }, 500);
      }
    }, 60);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="border border-inherit/40 p-3 bg-inherit/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold tracking-wider flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>BESTANDENUITWISSELING & XMODEM DOWNLOADBIBLIOTHEEK</span>
          </h2>
          <p className="opacity-70 mt-0.5 text-[11px]">
            Off-grid overdracht van noodhandleidingen, frequentietabellen en configuratiebestanden.
          </p>
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'Alles' },
            { id: 'emergency', label: 'Noodplannen' },
            { id: 'mesh', label: 'Mesh/LoRa' },
            { id: 'tool', label: 'Scripts/Tools' },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => {
                sound.keyClick();
                setSelectedCategory(c.id);
              }}
              className={`px-2.5 py-1 border transition-colors ${
                selectedCategory === c.id
                  ? 'border-current bg-current/20 font-bold'
                  : 'border-inherit/30 hover:border-inherit/60'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Files Table */}
      <div className="border border-inherit/40 overflow-hidden">
        <div className="bg-inherit/10 px-3 py-1.5 font-bold border-b border-inherit/40 grid grid-cols-12 gap-2 text-xs select-none">
          <div className="col-span-6 sm:col-span-5">BESTANDSNAAM / BESCHRIJVING</div>
          <div className="col-span-3 sm:col-span-3">CATEGORIE · AUTEUR</div>
          <div className="col-span-3 sm:col-span-2 text-right">FORMAAT</div>
          <div className="col-span-12 sm:col-span-2 text-right">ACTIE</div>
        </div>

        <div className="divide-y divide-inherit/20">
          {filteredFiles.map(file => (
            <div
              key={file.id}
              className="p-3 grid grid-cols-12 gap-2 items-center hover:bg-white/5 transition-colors text-xs"
            >
              <div className="col-span-6 sm:col-span-5 space-y-0.5">
                <div className="font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="text-[11px] opacity-70 truncate">{file.description}</div>
              </div>

              <div className="col-span-3 sm:col-span-3 text-[11px] opacity-80 truncate">
                <span className="uppercase font-semibold">[{file.category}]</span>
                <span className="opacity-60 ml-1">door {file.uploader}</span>
              </div>

              <div className="col-span-3 sm:col-span-2 text-right tabular-nums text-xs opacity-75">
                <span>{file.sizeKb} KB</span>
                <div className="text-[10px] opacity-50">{file.downloads}x gedownload</div>
              </div>

              <div className="col-span-12 sm:col-span-2 text-right">
                <button
                  onClick={() => startXmodemDownload(file)}
                  className="px-3 py-1 bg-current text-black font-bold text-xs hover:opacity-90 inline-flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>XMODEM DL</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulated XMODEM Download Modal */}
      {transferringFile && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="border-2 border-inherit bg-neutral-950 text-inherit w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-inherit/40 pb-2">
              <span className="font-bold text-sm tracking-wide flex items-center gap-2 text-amber-400">
                <Terminal className="w-4 h-4" />
                <span>XMODEM-CRC OVERDRACHT BEZIG</span>
              </span>
              <span className="text-xs tabular-nums">19200 BPS</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Bestand: <strong>{transferringFile.name}</strong></span>
                <span className="tabular-nums font-bold">{transferProgress}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-black border border-inherit/40 p-1">
                <div
                  className="h-3 bg-current transition-all duration-75"
                  style={{ width: `${transferProgress}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] opacity-70">
                <span>Verzendblok #{transferBlock} (128 bytes/blok)</span>
                <span>CRC-16: [GEVALIDEERD]</span>
              </div>
            </div>

            <p className="text-[11px] opacity-75 leading-relaxed">
              Het bestand wordt overgedragen via virtuele seriële blokken met foutcorrectie. De browser bewaart het bestand na voltooiing direct op uw schijf.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
