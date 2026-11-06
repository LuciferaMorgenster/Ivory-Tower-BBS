/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/sound';
import { ANSI, AnsiRenderer } from '../utils/ansi';
import {
  Radio,
  Send,
  Terminal,
  Activity,
  ShieldCheck,
  RefreshCw,
  MapPin,
  Compass,
  Volume2,
  Play,
  CheckCircle,
  CloudSun,
  Sun,
  Wind,
  Thermometer,
  BatteryCharging,
  Zap,
  Waves,
  PhoneCall,
} from 'lucide-react';

interface PacketMessage {
  id: string;
  sender: string;
  callsign: string;
  nodeId: string;
  frequency: string;
  rssi: number; // e.g. -84 dBm
  snr: number;  // e.g. 9.5 dB
  hops: number;
  text: string;
  rawHex: string;
  timestamp: string;
}

const INITIAL_PACKETS: PacketMessage[] = [
  {
    id: 'pkt-1',
    sender: 'Kees_Mesh',
    callsign: 'PD2MNT',
    nodeId: '0x8A4F',
    frequency: '869.525 MHz',
    rssi: -84,
    snr: 9.2,
    hops: 1,
    text: `${ANSI.BRIGHT_GREEN}[MESH BEACON]${ANSI.RESET} Watertoren repeater operationeel. Zonnelader actief (4.12V).`,
    rawHex: 'AA 55 8A 4F 01 04 12 5B 4D 45 53 48 20 42 45 41 43 4F 4E 5D',
    timestamp: '10:42:15',
  },
  {
    id: 'pkt-2',
    sender: 'Anouk_K',
    callsign: 'NL-UT04',
    nodeId: '0x3C19',
    frequency: '869.525 MHz',
    rssi: -78,
    snr: 11.0,
    hops: 0,
    text: 'Buurthuis geopend. Koffie staat klaar voor wie zaterdag komt meehelpen met het aggregaat!',
    rawHex: 'AA 55 3C 19 00 42 75 75 72 74 68 75 69 73 20 67 65 6F 70 65',
    timestamp: '10:43:02',
  },
  {
    id: 'pkt-3',
    sender: 'Bart_Radio',
    callsign: 'PA1BRT',
    nodeId: '0x1F90',
    frequency: '144.800 MHz (VHF)',
    rssi: -92,
    snr: 6.8,
    hops: 2,
    text: `${ANSI.BRIGHT_YELLOW}[APRS DIGI]${ANSI.RESET} Packet overdracht test via 2-meter antenne geslaagd. 73!`,
    rawHex: 'AA 55 1F 90 02 5B 41 50 52 53 20 44 49 47 49 5D 20 54 45 53',
    timestamp: '10:44:30',
  },
];

export const PacketChatView: React.FC = () => {
  const [packets, setPackets] = useState<PacketMessage[]>(INITIAL_PACKETS);
  const [inputText, setInputText] = useState('');
  const [viewMode, setViewMode] = useState<'decoded' | 'raw'>('decoded');
  const [subTab, setSubTab] = useState<'stream' | 'topology' | 'weather' | 'frequencies'>('stream');
  const [isReceiving, setIsReceiving] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Traceroute & Morse state
  const [targetNode, setTargetNode] = useState('0x8A4F');
  const [tracerouteRunning, setTracerouteRunning] = useState(false);
  const [tracerouteResult, setTracerouteResult] = useState<
    Array<{ hop: number; node: string; name: string; rtt: number; rssi: number }> | null
  >(null);
  const [morseText, setMorseText] = useState('CQ CQ PA3BBS');

  // Bell 202 AFSK & Weather state
  const [afskText, setAfskText] = useState('PA3BBS DE NL-UT04 QSL 73');
  const [afskTransmitting, setAfskTransmitting] = useState(false);
  const [weatherBeaconSent, setWeatherBeaconSent] = useState(false);

  const runTraceroute = (nodeId: string) => {
    sound.execute();
    setTracerouteRunning(true);
    setTracerouteResult(null);

    setTimeout(() => {
      sound.bell();
      setTracerouteRunning(false);
      if (nodeId === '0x3C19') {
        setTracerouteResult([
          { hop: 1, node: '0x3C19', name: 'Buurthuis Node #2', rtt: 34, rssi: -78 },
        ]);
      } else if (nodeId === '0x8A4F') {
        setTracerouteResult([
          { hop: 1, node: '0x8A4F', name: 'Watertoren Repeater Node #3', rtt: 48, rssi: -84 },
        ]);
      } else {
        setTracerouteResult([
          { hop: 1, node: '0x8A4F', name: 'Watertoren Repeater Node #3', rtt: 48, rssi: -84 },
          { hop: 2, node: nodeId, name: nodeId === '0x99A1' ? 'Mobiele Veldpost #4' : 'Molen Digi-Repeater #5', rtt: 112, rssi: -92 },
        ]);
      }
    }, 850);
  };

  const handleSendWeatherBeacon = () => {
    sound.bell();
    const newPkt: PacketMessage = {
      id: `pkt-wx-${Date.now()}`,
      sender: 'Buurthuis_Meteo',
      callsign: 'NL-UT04 WX',
      nodeId: '0x3C19',
      frequency: '144.800 MHz (APRS)',
      rssi: -76,
      snr: 12.2,
      hops: 0,
      text: `${ANSI.BRIGHT_CYAN}[APRS WX]${ANSI.RESET} Temp: 17.8°C | Baro: 1018.4 hPa | Vocht: 64% | Wind: 14 km/u ZW | Accu: 25.6V (98%)`,
      rawHex: 'AA 55 3C 19 00 21 35 32 30 35 2E 34 30 4E 2F 30 30 35 30 37',
      timestamp: new Date().toLocaleTimeString(),
    };
    setPackets(prev => [...prev, newPkt]);
    setWeatherBeaconSent(true);
    setTimeout(() => setWeatherBeaconSent(false), 3000);
  };

  const handleTransmitAfsk = () => {
    if (!afskText.trim()) return;
    setAfskTransmitting(true);
    sound.playBell202Afsk(afskText);
    setTimeout(() => {
      setAfskTransmitting(false);
      sound.execute();
    }, 600);
  };

  // Auto-scroll chat to bottom on new packet
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [packets]);

  // Simulate incoming radio packet periodically or on button click
  const simulateIncomingPacket = () => {
    sound.bell();
    setIsReceiving(true);

    setTimeout(() => {
      const mockSenders = [
        { name: 'Kees_Mesh', call: 'PD2MNT', node: '0x8A4F', freq: '869.525 MHz', msg: 'QSL! Rapport 59 hier in het bos.' },
        { name: 'Sanne_Tuin', call: 'NL-GR09', node: '0x99A1', freq: '869.525 MHz', msg: 'Heeft iemand de hakselaar al gereserveerd voor zondag?' },
        { name: 'Noodpost_Oost', call: 'PI4EMG', node: '0x00FF', freq: '144.850 MHz', msg: `${ANSI.BRIGHT_RED}[NOODNET]${ANSI.RESET} Stand-by op kanaal 1. Geen bijzonderheden gemeld.` },
      ];
      const pick = mockSenders[Math.floor(Math.random() * mockSenders.length)];

      const newPkt: PacketMessage = {
        id: `pkt-${Date.now()}`,
        sender: pick.name,
        callsign: pick.call,
        nodeId: pick.node,
        frequency: pick.freq,
        rssi: Math.floor(-95 + Math.random() * 25),
        snr: parseFloat((5 + Math.random() * 7).toFixed(1)),
        hops: Math.floor(Math.random() * 3),
        text: pick.msg,
        rawHex: 'AA 55 ' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0')).join(' '),
        timestamp: new Date().toLocaleTimeString(),
      };

      setPackets(prev => [...prev, newPkt]);
      setIsReceiving(false);
    }, 600);
  };

  const handleSendPacket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sound.execute();
    const newPkt: PacketMessage = {
      id: `pkt-${Date.now()}`,
      sender: 'SysOp-Willem',
      callsign: 'PA3BBS',
      nodeId: '0x0001',
      frequency: '869.525 MHz',
      rssi: -65,
      snr: 12.5,
      hops: 0,
      text: inputText.trim(),
      rawHex: 'AA 55 00 01 00 ' + Array.from(new TextEncoder().encode(inputText.trim().slice(0, 16))).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' '),
      timestamp: new Date().toLocaleTimeString(),
    };

    setPackets(prev => [...prev, newPkt]);
    setInputText('');
  };

  const insertMacro = (macroText: string) => {
    sound.keyClick();
    setInputText(prev => (prev ? `${prev} ${macroText}` : macroText));
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="border border-inherit/40 p-3 bg-inherit/5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>REAL-TIME PACKET RADIO & MESH TERMINAL</span>
          </h2>
          <p className="opacity-70 mt-0.5 text-[11px]">
            Directe ongebufferde communicatie over LoRa (869.525 MHz), AX.25 Packet Radio, APRS en Bell 202 AFSK.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sub-tab switcher */}
          <div className="flex items-center border border-inherit/50 text-xs flex-wrap">
            <button
              onClick={() => {
                sound.keyClick();
                setSubTab('stream');
              }}
              className={`px-2.5 py-1.5 transition-colors ${
                subTab === 'stream'
                  ? 'bg-current text-black font-bold'
                  : 'hover:bg-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              STREAM ({packets.length})
            </button>
            <button
              onClick={() => {
                sound.keyClick();
                setSubTab('topology');
              }}
              className={`px-2.5 py-1.5 transition-colors ${
                subTab === 'topology'
                  ? 'bg-current text-black font-bold'
                  : 'hover:bg-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              TOPOLOGIE & TRACE
            </button>
            <button
              onClick={() => {
                sound.keyClick();
                setSubTab('weather');
              }}
              className={`px-2.5 py-1.5 transition-colors ${
                subTab === 'weather'
                  ? 'bg-current text-black font-bold'
                  : 'hover:bg-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              WEERSTATION & ZON
            </button>
            <button
              onClick={() => {
                sound.keyClick();
                setSubTab('frequencies');
              }}
              className={`px-2.5 py-1.5 transition-colors ${
                subTab === 'frequencies'
                  ? 'bg-current text-black font-bold'
                  : 'hover:bg-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              BELL 202 & NOODKANALEN
            </button>
          </div>

          {subTab === 'stream' && (
            <>
              <button
                onClick={() => {
                  sound.keyClick();
                  setViewMode(prev => (prev === 'decoded' ? 'raw' : 'decoded'));
                }}
                className="px-2 py-1.5 border border-inherit/40 hover:bg-white/10 text-xs"
              >
                {viewMode === 'decoded' ? 'RAW HEX' : 'GEDECODEERD'}
              </button>

              <button
                onClick={simulateIncomingPacket}
                disabled={isReceiving}
                className="px-2.5 py-1.5 bg-current text-black font-bold text-xs hover:opacity-90 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isReceiving ? 'animate-spin' : ''}`} />
                <span>LUISTER</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* View 1: Packet Stream Console */}
      {subTab === 'stream' && (
        <div className="border border-inherit/40 bg-black/60 p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-inherit/30 pb-2 text-[11px] opacity-75">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 inline-block bg-emerald-400 rounded-none animate-pulse" />
              <span>FREQ: 869.525 MHz · MODEM: LoRa LongFast · BANDBREEDTE: 250 kHz</span>
            </div>
            <span className="tabular-nums">{packets.length} radio-pakketten ontvangen</span>
          </div>

          {/* Chat Messages Log */}
          <div
            ref={chatScrollRef}
            className="h-80 overflow-y-auto space-y-2.5 pr-2 font-mono text-xs"
          >
            {packets.map(pkt => {
              const isSelf = pkt.callsign === 'PA3BBS';
              return (
                <div
                  key={pkt.id}
                  className={`p-2.5 border transition-colors ${
                    isSelf
                      ? 'border-emerald-600/60 bg-emerald-950/20 ml-6'
                      : 'border-inherit/30 bg-black/40 mr-6'
                  }`}
                >
                  {/* Packet Header Telemetry */}
                  <div className="flex items-center justify-between text-[10px] opacity-70 border-b border-inherit/20 pb-1 mb-1.5">
                    <div className="flex items-center gap-2">
                      <strong className="text-current opacity-100">{pkt.sender}</strong>
                      <span>({pkt.callsign})</span>
                      <span className="opacity-50">[{pkt.nodeId}]</span>
                    </div>
                    <div className="flex items-center gap-2 tabular-nums">
                      <span>{pkt.rssi} dBm</span>
                      <span>SNR: {pkt.snr}dB</span>
                      <span>Hops: {pkt.hops}</span>
                      <span className="opacity-60">{pkt.timestamp}</span>
                    </div>
                  </div>

                  {/* Body: Decoded text or Raw Hex */}
                  {viewMode === 'decoded' ? (
                    <div className="leading-relaxed">
                      <AnsiRenderer text={pkt.text} />
                    </div>
                  ) : (
                    <div className="text-[11px] opacity-80 text-amber-300 font-mono tracking-wider">
                      {pkt.rawHex}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Radio Macros Toolbar */}
          <div className="flex items-center gap-1 flex-wrap border-t border-inherit/20 pt-2 text-[10px] select-none">
            <span className="opacity-60 mr-1">SNELLE MACRO'S:</span>
            {[
              { label: '73 (Groeten)', text: '73 en tot de volgende verbinding!' },
              { label: 'QSL (Ontvangen)', text: 'QSL, bericht 100% ontvangen en begrepen.' },
              { label: 'QTH (Locatie)', text: 'QTH: Buurthuis centrum node #1.' },
              { label: 'QRV (Stand-by)', text: 'QRV op kanaal 1 voor noodberichten.' },
              { label: 'TEST PING', text: '[PING] Signaalsterkte controle op 869 MHz.' },
            ].map(m => (
              <button
                key={m.label}
                type="button"
                onClick={() => insertMacro(m.text)}
                className="px-2 py-0.5 border border-inherit/30 hover:bg-white/10"
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendPacket} className="flex items-center gap-2 pt-1">
            <span className="text-xs font-bold opacity-75 shrink-0">TX&gt;</span>
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Typ een direct radiobericht om uit te zenden over de mesh..."
              className="flex-1 bg-black border border-inherit/50 p-2 text-xs font-mono text-inherit outline-none focus:border-current"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-current text-black font-bold text-xs hover:opacity-90 flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>UITZENDEN (TX)</span>
            </button>
          </form>
        </div>
      )}

      {/* View 2: Mesh Topology & Traceroute */}
      {subTab === 'topology' && (
        <div className="space-y-4">
          {/* Visual ASCII Network Diagram */}
          <div className="border border-inherit/40 bg-black/60 p-4 font-mono text-xs overflow-x-auto">
            <div className="flex items-center justify-between border-b border-inherit/30 pb-2 mb-3">
              <span className="font-bold flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                REGIONALE MESH NETWERKKAART (LORA 869.525 MHz / AX.25 VHF)
              </span>
              <span className="text-[11px] opacity-70">5 ACTIEVE KRACHTNODES</span>
            </div>

            <pre className="text-[11px] leading-tight text-current opacity-90 select-none">
{`
                               ┌──────────────────────────────────────────────┐
                               │       [NODE #3: WATERTOREN REPEATER]         │
                               │  0x8A4F • PD2MNT • 1.8km • Solar Accu 4.12V  │
                               │  RSSI: -84 dBm • SNR: +9.2 dB • LoRa 869 MHz │
                               └──────────────┬────────────────┬──────────────┘
                                              │                │
                      ┌───────────────────────┘                └───────────────────────┐
                      │                                                                │
           ┌──────────┴──────────┐                                          ┌──────────┴──────────┐
           │  [HOOFDSTATION #1]  │                                          │  [VELDPOST #4]      │
           │  PA3BBS (0x0001)    │                                          │  NL-GR09 (0x99A1)   │
           │  Buurthuis Lokaal   │                                          │  3.2 km • Accu 3.9V │
           │  Status: DIT SYSTEEM│                                          │  RSSI: -89 dBm      │
           └──────────┬──────────┘                                          └──────────┬──────────┘
                      │                                                                │
           ┌──────────┴──────────┐                                          ┌──────────┴──────────┐
           │  [BUURTHUIS #2]     │                                          │  [MOLEN DIGI #5]    │
           │  NL-UT04 (0x3C19)   │                                          │  PA1BRT (0x1F90)    │
           │  0.4 km • Accu 4.15V│                                          │  5.1 km • Solar 4.2V│
           │  RSSI: -78 dBm      │                                          │  144.800 MHz (VHF)  │
           └─────────────────────┘                                          └─────────────────────┘
`}
            </pre>
          </div>

          {/* Traceroute Console & Morse Transmitter Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Traceroute Tool */}
            <div className="border border-inherit/40 bg-black/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-inherit/30 pb-2">
                <span className="font-bold flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>MESH TRACEROUTE & LOKAAL PING-STATION</span>
                </span>
                <span className="text-[10px] opacity-60">TTL: 3 HOPS</span>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] opacity-75 block">
                  Selecteer doelstation om verbinding en hops te testen:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: '0x3C19', label: 'Buurthuis #2 (0x3C19)' },
                    { id: '0x8A4F', label: 'Watertoren Repeater #3 (0x8A4F)' },
                    { id: '0x99A1', label: 'Veldpost #4 (0x99A1)' },
                    { id: '0x1F90', label: 'Molen Digi #5 (0x1F90)' },
                  ].map(n => (
                    <button
                      key={n.id}
                      onClick={() => {
                        sound.keyClick();
                        setTargetNode(n.id);
                      }}
                      className={`px-2 py-1 text-[11px] border ${
                        targetNode === n.id
                          ? 'border-current bg-current text-black font-bold'
                          : 'border-inherit/30 hover:bg-white/10'
                      }`}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => runTraceroute(targetNode)}
                disabled={tracerouteRunning}
                className="w-full py-2 bg-current text-black font-bold text-xs hover:opacity-90 flex items-center justify-center gap-2 mt-2"
              >
                {tracerouteRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>TRACEROUTE PAKKETTEN VERZENDEN...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>START TRACEROUTE NAAR {targetNode}</span>
                  </>
                )}
              </button>

              {/* Traceroute Results Table */}
              {tracerouteResult && (
                <div className="border border-inherit/40 p-3 bg-inherit/5 space-y-2 mt-3 animate-fadeIn">
                  <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>TRACEROUTE VOLTOOID VOOR {targetNode}:</span>
                  </div>

                  <table className="w-full text-left text-[11px] border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-inherit/30 opacity-70">
                        <th className="py-1">HOP</th>
                        <th className="py-1">NODE</th>
                        <th className="py-1">STATION</th>
                        <th className="py-1">RTT</th>
                        <th className="py-1">SIGNAAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tracerouteResult.map(res => (
                        <tr key={res.hop} className="border-b border-inherit/15">
                          <td className="py-1.5 font-bold">#{res.hop}</td>
                          <td className="py-1.5 opacity-90">{res.node}</td>
                          <td className="py-1.5">{res.name}</td>
                          <td className="py-1.5 tabular-nums text-emerald-400 font-bold">{res.rtt} ms</td>
                          <td className="py-1.5 tabular-nums">{res.rssi} dBm</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[10px] opacity-70 pt-1">
                    Signaalkwaliteit: Uitstekend • Packet loss: 0% • Versleuteld met SHA-256 Mesh Key
                  </p>
                </div>
              )}
            </div>

            {/* Morse Code (CW) Synthesizer */}
            <div className="border border-inherit/40 bg-black/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-inherit/30 pb-2">
                <span className="font-bold flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>CW MORSE-CODE AUDIOSYNTHESIZER (700 HZ)</span>
                </span>
                <span className="text-[10px] opacity-60">WEB AUDIO API</span>
              </div>

              <p className="text-[11px] opacity-75">
                Zet tekst om in zuivere 700Hz sinustonen (dits & dahs) voor audio-baken uitzendingen of noodcommunicatie.
              </p>

              <div>
                <label className="text-[10px] opacity-70 block mb-1">
                  CALLSIGN OF TEKST VOOR MORSE UITZENDING:
                </label>
                <input
                  type="text"
                  value={morseText}
                  onChange={e => setMorseText(e.target.value.toUpperCase())}
                  className="w-full bg-black border border-inherit/50 p-2 text-xs font-mono uppercase text-inherit outline-none focus:border-current"
                  placeholder="Bijv. CQ CQ PA3BBS of SOS"
                  maxLength={32}
                />
              </div>

              {/* Quick Morse Presets */}
              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                <span className="opacity-60">VOORKEUREN:</span>
                {[
                  { label: 'SOS', text: 'SOS' },
                  { label: 'CQ CQ PA3BBS', text: 'CQ CQ PA3BBS' },
                  { label: '73 (Groet)', text: '73' },
                  { label: 'QTH BUURTHUIS', text: 'QTH BUURTHUIS' },
                ].map(p => (
                  <button
                    key={p.label}
                    onClick={() => {
                      sound.keyClick();
                      setMorseText(p.text);
                    }}
                    className="px-2 py-0.5 border border-inherit/30 hover:bg-white/10"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  sound.playMorseCode(morseText);
                }}
                className="w-full py-2 border-2 border-inherit hover:bg-inherit/10 font-bold text-xs flex items-center justify-center gap-2 mt-2"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>SPEEL MORSE AUDIOSIGNAAL AF (CW)</span>
              </button>

              <div className="p-2 border border-inherit/30 bg-inherit/5 text-[10px] opacity-70">
                <strong>Tip:</strong> Zorg ervoor dat het luidsprekericoontje in de bovenste statusbalk actief is om de audio te horen.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 3: APRS Weather Station & Solar Space Weather */}
      {subTab === 'weather' && (
        <div className="space-y-4">
          {/* Top Meteo Telemetry Banner */}
          <div className="border border-inherit/40 bg-black/60 p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-inherit/30 pb-2 mb-3">
              <span className="font-bold flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-cyan-400" />
                <span>LOKAAL METEO-STATION // TELEMETRIE BAKEN (NL-UT04 WX)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] opacity-70">LOCATIE: 52°05'N 005°07'E (JO22)</span>
                <button
                  onClick={handleSendWeatherBeacon}
                  className="px-2.5 py-1 bg-current text-black font-bold text-xs hover:opacity-90 flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>ZEND WX BEACON</span>
                </button>
              </div>
            </div>

            {weatherBeaconSent && (
              <div className="mb-3 p-2 border border-emerald-500/60 bg-emerald-950/20 text-emerald-400 text-[11px] font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle className="w-4 h-4" />
                <span>Weerbericht als APRS packet verzonden naar de stream!</span>
              </div>
            )}

            {/* Weather Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="border border-inherit/30 p-2.5 bg-inherit/5">
                <div className="flex items-center justify-between opacity-70 text-[10px]">
                  <span>TEMPERATUUR</span>
                  <Thermometer className="w-3 h-3 text-amber-400" />
                </div>
                <div className="text-base font-bold mt-1 text-amber-300 tabular-nums">
                  17.8 °C
                </div>
                <div className="text-[10px] opacity-60">Min 11.2 / Max 19.4</div>
              </div>

              <div className="border border-inherit/30 p-2.5 bg-inherit/5">
                <div className="flex items-center justify-between opacity-70 text-[10px]">
                  <span>LUCHTDRUK</span>
                  <Compass className="w-3 h-3 text-cyan-400" />
                </div>
                <div className="text-base font-bold mt-1 tabular-nums">
                  1018.4 <span className="text-[10px] font-normal opacity-70">hPa</span>
                </div>
                <div className="text-[10px] opacity-60 text-emerald-400">Trend: Stabiel</div>
              </div>

              <div className="border border-inherit/30 p-2.5 bg-inherit/5">
                <div className="flex items-center justify-between opacity-70 text-[10px]">
                  <span>VOCHTIGHEID</span>
                  <Waves className="w-3 h-3 text-blue-400" />
                </div>
                <div className="text-base font-bold mt-1 tabular-nums">
                  64 %
                </div>
                <div className="text-[10px] opacity-60">Dauwpunt: 10.8 °C</div>
              </div>

              <div className="border border-inherit/30 p-2.5 bg-inherit/5">
                <div className="flex items-center justify-between opacity-70 text-[10px]">
                  <span>WINDKRACHT</span>
                  <Wind className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="text-base font-bold mt-1 tabular-nums">
                  14 <span className="text-[10px] font-normal opacity-70">km/u</span>
                </div>
                <div className="text-[10px] opacity-60">Richting: ZW (225°)</div>
              </div>

              <div className="border border-inherit/30 p-2.5 bg-inherit/5">
                <div className="flex items-center justify-between opacity-70 text-[10px]">
                  <span>ZONNE-STRALING</span>
                  <Sun className="w-3 h-3 text-amber-400" />
                </div>
                <div className="text-base font-bold mt-1 tabular-nums">
                  480 <span className="text-[10px] font-normal opacity-70">W/m²</span>
                </div>
                <div className="text-[10px] opacity-60">UV-Index: 3.2</div>
              </div>

              <div className="border border-inherit/30 p-2.5 bg-inherit/5">
                <div className="flex items-center justify-between opacity-70 text-[10px]">
                  <span>NOODACCU BANK</span>
                  <BatteryCharging className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="text-base font-bold mt-1 text-emerald-400 tabular-nums">
                  25.6 V <span className="text-[10px] font-normal opacity-80">(98%)</span>
                </div>
                <div className="text-[10px] opacity-60">Laadstroom: +14.2A</div>
              </div>
            </div>
          </div>

          {/* Solar & HF/VHF Propagation Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-inherit/40 bg-black/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-inherit/30 pb-2">
                <span className="font-bold flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>RUIMTEWEER & IONOSFEER PROPAGATIE</span>
                </span>
                <span className="text-[10px] opacity-70">NOAA / SIDC REAL-TIME</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="border border-inherit/30 p-2">
                  <div className="text-[10px] opacity-70">SOLAR FLUX (SFI)</div>
                  <div className="text-base font-bold mt-1 text-emerald-400">148</div>
                  <div className="text-[9px] opacity-60">UITSTEKEND (&gt;120)</div>
                </div>
                <div className="border border-inherit/30 p-2">
                  <div className="text-[10px] opacity-70">GEOMAGNETISCH K</div>
                  <div className="text-base font-bold mt-1 text-emerald-400">2</div>
                  <div className="text-[9px] opacity-60">RUSTIG (QUIET)</div>
                </div>
                <div className="border border-inherit/30 p-2">
                  <div className="text-[10px] opacity-70">A-INDEX</div>
                  <div className="text-base font-bold mt-1 text-emerald-400">6</div>
                  <div className="text-[9px] opacity-60">GUNSTIG (&lt;10)</div>
                </div>
              </div>

              <p className="text-[11px] opacity-80 leading-relaxed">
                De ionosfeer vertoont stabiele F2-laag reflectie. Uitstekende condities voor
                noodcommunicatie op HF (7 MHz / 14 MHz) en verhoogde troposferische ducting op 144 MHz VHF.
              </p>
            </div>

            <div className="border border-inherit/40 bg-black/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-inherit/30 pb-2">
                <span className="font-bold flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>RADIOBAND CONDITIES (NEDERLAND & CENTRAAL-EUROPA)</span>
                </span>
                <span className="text-[10px] opacity-70">MUF: 24.2 MHz</span>
              </div>

              <table className="w-full text-left text-[11px] border-collapse font-mono">
                <thead>
                  <tr className="border-b border-inherit/30 opacity-70">
                    <th className="py-1">BAND</th>
                    <th className="py-1">DAGSTATUS</th>
                    <th className="py-1">NACHTSTATUS</th>
                    <th className="py-1">TOEPASSING</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-inherit/15">
                    <td className="py-1 font-bold">80m (3.5 MHz)</td>
                    <td className="py-1 opacity-75 text-amber-400">D-laag absorptie</td>
                    <td className="py-1 font-bold text-emerald-400">Uitstekend</td>
                    <td className="py-1 opacity-70">Lokaal Noodnet (NVIS)</td>
                  </tr>
                  <tr className="border-b border-inherit/15">
                    <td className="py-1 font-bold">40m (7.0 MHz)</td>
                    <td className="py-1 font-bold text-emerald-400">Goed</td>
                    <td className="py-1 font-bold text-emerald-400">Uitstekend</td>
                    <td className="py-1 opacity-70">Regionaal (100-600 km)</td>
                  </tr>
                  <tr className="border-b border-inherit/15">
                    <td className="py-1 font-bold">20m (14.0 MHz)</td>
                    <td className="py-1 font-bold text-emerald-400">Uitstekend</td>
                    <td className="py-1 opacity-60">Gesloten</td>
                    <td className="py-1 opacity-70">Europees / DX</td>
                  </tr>
                  <tr className="border-b border-inherit/15">
                    <td className="py-1 font-bold">2m (144 MHz)</td>
                    <td className="py-1 font-bold text-emerald-400">Goed / Open</td>
                    <td className="py-1 font-bold text-emerald-400">Goed / Open</td>
                    <td className="py-1 opacity-70">APRS & Lokaal Packet</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold">869 MHz (LoRa)</td>
                    <td className="py-1 font-bold text-emerald-400">Optimaal</td>
                    <td className="py-1 font-bold text-emerald-400">Optimaal</td>
                    <td className="py-1 opacity-70">Buurt Mesh Netwerk</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View 4: Emergency Frequencies & Bell 202 AFSK Acoustic Modulator */}
      {subTab === 'frequencies' && (
        <div className="space-y-4">
          {/* Emergency Frequency Directory */}
          <div className="border border-inherit/40 bg-black/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-inherit/30 pb-2">
              <span className="font-bold flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>OFFICIËLE NOODFREQUENTIES & BURGERNET GIDS (NEDERLAND & REGIO)</span>
              </span>
              <span className="text-[10px] opacity-70">STAND-BY ROOSTER</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse font-mono">
                <thead>
                  <tr className="border-b border-inherit/30 opacity-70">
                    <th className="py-1.5 px-2">KANAAL / DIENST</th>
                    <th className="py-1.5 px-2">FREQUENTIE</th>
                    <th className="py-1.5 px-2">MODUS</th>
                    <th className="py-1.5 px-2">SUBTOON (CTCSS)</th>
                    <th className="py-1.5 px-2">ROL & TOEPASSING</th>
                    <th className="py-1.5 px-2 text-right">TEST TOON</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-inherit/15 hover:bg-white/5">
                    <td className="py-2 px-2 font-bold text-amber-300">PMR446 Kanaal 8</td>
                    <td className="py-2 px-2 tabular-nums">446.09375 MHz</td>
                    <td className="py-2 px-2">FM Narrow</td>
                    <td className="py-2 px-2 font-bold text-emerald-400">88.5 Hz (CTCSS 8)</td>
                    <td className="py-2 px-2 opacity-90">Landelijk vergunningsvrij noodkanaal burgers</td>
                    <td className="py-2 px-2 text-right">
                      <button
                        onClick={() => sound.playCtcssTone(88.5)}
                        className="px-2 py-0.5 border border-inherit/40 hover:bg-white/10 text-[10px]"
                        title="Speel 88.5 Hz subtoon af"
                      >
                        TOON (88.5Hz)
                      </button>
                    </td>
                  </tr>
                  <tr className="border-b border-inherit/15 hover:bg-white/5">
                    <td className="py-2 px-2 font-bold">VHF Amateur Noodnet</td>
                    <td className="py-2 px-2 tabular-nums">145.500 MHz</td>
                    <td className="py-2 px-2">FM (V40 / S20)</td>
                    <td className="py-2 px-2 opacity-50">Geen (Open)</td>
                    <td className="py-2 px-2 opacity-90">Algemeen oproep- en noodkanaal radioamateurs</td>
                    <td className="py-2 px-2 text-right opacity-50">-</td>
                  </tr>
                  <tr className="border-b border-inherit/15 hover:bg-white/5">
                    <td className="py-2 px-2 font-bold text-cyan-300">APRS Packet Radio</td>
                    <td className="py-2 px-2 tabular-nums">144.800 MHz</td>
                    <td className="py-2 px-2">AFSK 1200 baud</td>
                    <td className="py-2 px-2 opacity-50">Bell 202</td>
                    <td className="py-2 px-2 opacity-90">Positiebaken, WX weerstations en digipeaters</td>
                    <td className="py-2 px-2 text-right">
                      <button
                        onClick={() => sound.playBell202Afsk('APRS TEST')}
                        className="px-2 py-0.5 border border-inherit/40 hover:bg-white/10 text-[10px]"
                      >
                        AFSK TEST
                      </button>
                    </td>
                  </tr>
                  <tr className="border-b border-inherit/15 hover:bg-white/5">
                    <td className="py-2 px-2 font-bold text-emerald-300">LoRa Meshtastic (EU)</td>
                    <td className="py-2 px-2 tabular-nums">869.525 MHz</td>
                    <td className="py-2 px-2">LoRa LongFast</td>
                    <td className="py-2 px-2">Slot 20 / 250kHz</td>
                    <td className="py-2 px-2 opacity-90">Off-grid buurt mesh communicatie en telemetrie</td>
                    <td className="py-2 px-2 text-right opacity-50">-</td>
                  </tr>
                  <tr className="border-b border-inherit/15 hover:bg-white/5">
                    <td className="py-2 px-2 font-bold">CB 27 MHz Kanaal 9</td>
                    <td className="py-2 px-2 tabular-nums">27.065 MHz</td>
                    <td className="py-2 px-2">AM / FM</td>
                    <td className="py-2 px-2 opacity-50">Geen</td>
                    <td className="py-2 px-2 opacity-90">Internationaal CB noodkanaal / bakkie</td>
                    <td className="py-2 px-2 text-right opacity-50">-</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="py-2 px-2 font-bold">VHF Marine Kanaal 16</td>
                    <td className="py-2 px-2 tabular-nums">156.800 MHz</td>
                    <td className="py-2 px-2">FM</td>
                    <td className="py-2 px-2 opacity-50">Geen</td>
                    <td className="py-2 px-2 opacity-90">Kustwacht en scheepvaart nood & veiligheid</td>
                    <td className="py-2 px-2 text-right opacity-50">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bell 202 AFSK Acoustic Audio Modulator */}
          <div className="border border-inherit/40 bg-black/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-inherit/30 pb-2">
              <span className="font-bold flex items-center gap-2">
                <Waves className="w-4 h-4 text-emerald-400" />
                <span>BELL 202 AFSK ACOUSTIC AUDIO MODULATOR (1200 BAUD AX.25)</span>
              </span>
              <span className="text-[10px] opacity-70">MARK: 1200Hz | SPACE: 2200Hz</span>
            </div>

            <p className="text-[11px] opacity-80 leading-relaxed">
              Zend packet data akoestisch uit via luidsprekers naar een portofoon microfoon of
              tweede apparaat met een akoestische koppeling. Modulatie volgens Bell 202 AFSK standaard.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] opacity-70 block">
                TEKST OF OPROEP VOOR BELL 202 AFSK TRANSMISSIE:
              </label>
              <input
                type="text"
                value={afskText}
                onChange={e => setAfskText(e.target.value)}
                maxLength={32}
                className="w-full bg-black border border-inherit/50 p-2 text-xs font-mono text-inherit outline-none focus:border-current"
                placeholder="Bijv. PA3BBS DE NL-UT04 QSL 73"
              />

              {/* Quick Macro Presets */}
              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                <span className="opacity-60">SNELLE TEKSTEN:</span>
                {[
                  { label: 'QSL 73', text: 'PA3BBS DE NL-UT04 QSL 73' },
                  { label: 'SOS NOODPOST', text: 'SOS DE NOODPOST UT04 QRV' },
                  { label: 'APRS BEACON', text: 'NL-UT04>APRS:TEST BEACON' },
                  { label: 'PING 869', text: 'PING MESH NODE 0x0001' },
                ].map(p => (
                  <button
                    key={p.label}
                    onClick={() => {
                      sound.keyClick();
                      setAfskText(p.text);
                    }}
                    className="px-2 py-0.5 border border-inherit/30 hover:bg-white/10"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="text-[10px] opacity-70 font-mono">
                Geëncodeerde bits: {afskText.length * 8 + 20} bits · Verwachte zendtijd: ~{( (afskText.length * 8 + 20) * 0.005 ).toFixed(2)}s
              </div>

              <button
                onClick={handleTransmitAfsk}
                disabled={afskTransmitting}
                className="px-4 py-2 bg-current text-black font-bold text-xs hover:opacity-90 flex items-center justify-center gap-2"
              >
                <Waves className={`w-3.5 h-3.5 ${afskTransmitting ? 'animate-bounce' : ''}`} />
                <span>{afskTransmitting ? 'ZENDEN OVER GELUID...' : 'ZEND AFSK AUDIO (BELL 202)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
