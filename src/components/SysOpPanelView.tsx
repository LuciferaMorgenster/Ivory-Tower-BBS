/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types';
import { storage } from '../utils/storage';
import { sound } from '../utils/sound';
import { ANSI, AnsiRenderer } from '../utils/ansi';
import {
  Server,
  Shield,
  ShieldAlert,
  Users,
  HardDrive,
  Terminal,
  AlertTriangle,
  RefreshCw,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  Radio,
  Sliders,
  Bell,
  Database,
} from 'lucide-react';
import { BbsNotification } from './NotificationDrawer';

interface SysOpUser {
  id: string;
  username: string;
  callsign: string;
  role: 'SysOp' | 'Moderator' | 'Lid' | 'Gast';
  nodeNumber: number;
  status: 'actief' | 'geblokkeerd' | 'afwezig';
  lastSeen: string;
  postsCount: number;
  canEncrypt: boolean;
}

const INITIAL_SYSOP_USERS: SysOpUser[] = [
  {
    id: 'u-1',
    username: 'SysOp-Willem',
    callsign: 'PA3BBS',
    role: 'SysOp',
    nodeNumber: 1,
    status: 'actief',
    lastSeen: 'Nu online',
    postsCount: 14,
    canEncrypt: true,
  },
  {
    id: 'u-2',
    username: 'Kees_Mesh',
    callsign: 'PD2MNT',
    role: 'Moderator',
    nodeNumber: 3,
    status: 'actief',
    lastSeen: '5 min geleden',
    postsCount: 8,
    canEncrypt: true,
  },
  {
    id: 'u-3',
    username: 'Anouk_K',
    callsign: 'NL-UT04',
    role: 'Lid',
    nodeNumber: 2,
    status: 'actief',
    lastSeen: '12 min geleden',
    postsCount: 6,
    canEncrypt: true,
  },
  {
    id: 'u-4',
    username: 'Bart_Radio',
    callsign: 'PA1BRT',
    role: 'Lid',
    nodeNumber: 5,
    status: 'afwezig',
    lastSeen: '2 uur geleden',
    postsCount: 3,
    canEncrypt: false,
  },
  {
    id: 'u-5',
    username: 'Gast-Wijkpost',
    callsign: 'NL-GR09',
    role: 'Gast',
    nodeNumber: 4,
    status: 'actief',
    lastSeen: 'Gisteren',
    postsCount: 1,
    canEncrypt: false,
  },
];

interface SysLogEntry {
  id: string;
  time: string;
  level: 'INFO' | 'WARN' | 'AUTH' | 'PACKET' | 'CRYPTO';
  message: string;
}

const INITIAL_SYSLOGS: SysLogEntry[] = [
  { id: 'log-1', time: '10:40:12', level: 'AUTH', message: 'SysOp-Willem ingelogd via TOTP 2FA verificatie.' },
  { id: 'log-2', time: '10:41:05', level: 'INFO', message: 'IndexedDB initialisatie voltooid: 4 borden, 12 berichten, 4 taken.' },
  { id: 'log-3', time: '10:42:15', level: 'PACKET', message: 'LoRa 869.525MHz baken ontvangen van Node #3 [Watertoren] (RSSI -84 dBm).' },
  { id: 'log-4', time: '10:43:00', level: 'CRYPTO', message: 'E2EE AES-256 sleutelafleiding succesvol voor kanaal SEC.' },
  { id: 'log-5', time: '10:44:22', level: 'WARN', message: 'Offline sync: 1 pending item in outbox wachtrij.' },
  { id: 'log-6', time: '10:45:10', level: 'PACKET', message: 'AX.25 packet doorgestuurd via digipeater PA1BRT (0x1F90).' },
];

interface SysOpPanelViewProps {
  user: UserAccount;
  onDataChange: () => void;
  onSendEmergencyBroadcast?: (title: string, body: string) => void;
}

export const SysOpPanelView: React.FC<SysOpPanelViewProps> = ({
  user,
  onDataChange,
  onSendEmergencyBroadcast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'users' | 'syslog' | 'maintenance'>('overview');
  const [usersList, setUsersList] = useState<SysOpUser[]>(INITIAL_SYSOP_USERS);
  const [logs, setLogs] = useState<SysLogEntry[]>(INITIAL_SYSLOGS);
  const [logFilter, setLogFilter] = useState<string>('ALL');
  const [broadcastTitle, setBroadcastTitle] = useState('NOODNET WAARSCHUWING');
  const [broadcastBody, setBroadcastBody] = useState('Periodieke batterijtest en noodstroomcontrole actief.');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [storageEstimate, setStorageEstimate] = useState<{ usedMb: number; quotaMb: number; pct: number }>({
    usedMb: 2.4,
    quotaMb: 500,
    pct: 0.5,
  });

  // Calculate storage quota via StorageManager if available
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        const usage = estimate.usage || 2400000;
        const quota = estimate.quota || 500000000;
        const usedMb = parseFloat((usage / (1024 * 1024)).toFixed(2));
        const quotaMb = parseFloat((quota / (1024 * 1024)).toFixed(0));
        const pct = parseFloat(((usage / quota) * 100).toFixed(1));
        setStorageEstimate({ usedMb, quotaMb, pct });
      }).catch(() => {});
    }
  }, []);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastBody.trim()) return;

    sound.bell();
    const newLog: SysLogEntry = {
      id: `log-${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      level: 'WARN',
      message: `[SYSOP BROADCAST] ${broadcastTitle}: ${broadcastBody}`,
    };
    setLogs(prev => [newLog, ...prev]);

    if (onSendEmergencyBroadcast) {
      onSendEmergencyBroadcast(broadcastTitle, broadcastBody);
    }

    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  const handleToggleUserStatus = (userId: string) => {
    sound.execute();
    setUsersList(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const nextStatus = u.status === 'actief' ? 'geblokkeerd' : 'actief';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const handleRoleChange = (userId: string, newRole: SysOpUser['role']) => {
    sound.execute();
    setUsersList(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const handleClearLogs = () => {
    sound.keyClick();
    setLogs([]);
  };

  const handleExportLogs = () => {
    sound.execute();
    const content = logs.map(l => `[${l.time}] [${l.level}] ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bbs-audit-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReindexDB = () => {
    sound.execute();
    const newLog: SysLogEntry = {
      id: `log-${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: 'IndexedDB B-Tree indexen geoptimaliseerd en geverifieerd (0 fouten).',
    };
    setLogs(prev => [newLog, ...prev]);
    onDataChange();
  };

  const filteredLogs = logs.filter(l => (logFilter === 'ALL' ? true : l.level === logFilter));

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="border border-inherit/40 p-3 bg-inherit/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-400" />
            <span>SYSOP BEHEERDER SCONSOLE // NODE #1 LOKAAL SYSTEEM</span>
          </h2>
          <p className="opacity-70 mt-0.5 text-[11px]">
            Geavanceerd knooppuntbeheer, noodnet-uitzendingen, gebruikersrollen en audit-logboek.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center border border-inherit/50 text-xs flex-wrap">
          {[
            { id: 'overview', label: 'OVERZICHT' },
            { id: 'users', label: `GEBRUIKERS (${usersList.length})` },
            { id: 'syslog', label: `SYSLOG (${logs.length})` },
            { id: 'maintenance', label: 'ONDERHOUD' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                sound.keyClick();
                setActiveSubTab(tab.id as any);
              }}
              className={`px-3 py-1.5 transition-colors ${
                activeSubTab === tab.id
                  ? 'bg-current text-black font-bold'
                  : 'hover:bg-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SubTab 1: Overview & Emergency Broadcast */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          {/* Metrics & Storage Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="border border-inherit/30 p-3 bg-black/40">
              <div className="flex items-center justify-between opacity-70 text-[10px]">
                <span>SYSTEEMSTATUS</span>
                <Server className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-none animate-pulse" />
                <span>ONLINE & VEERKRACHTIG</span>
              </div>
              <div className="text-[10px] opacity-60 mt-1">Uptime: 14d 06:42:19</div>
            </div>

            <div className="border border-inherit/30 p-3 bg-black/40">
              <div className="flex items-center justify-between opacity-70 text-[10px]">
                <span>INDEXEDDB OPSLAG</span>
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-base font-bold mt-1 tabular-nums">
                {storageEstimate.usedMb} MB <span className="text-xs font-normal opacity-60">/ {storageEstimate.quotaMb} MB</span>
              </div>
              <div className="text-[10px] opacity-60 mt-1">
                Quotagebruik: {storageEstimate.pct}%
              </div>
            </div>

            <div className="border border-inherit/30 p-3 bg-black/40">
              <div className="flex items-center justify-between opacity-70 text-[10px]">
                <span>REGISTRATIES</span>
                <Users className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-base font-bold mt-1 tabular-nums">
                {usersList.length} <span className="text-xs font-normal opacity-60">wijkleden</span>
              </div>
              <div className="text-[10px] opacity-60 mt-1">
                {usersList.filter(u => u.status === 'actief').length} actief · 1 geblokkeerd
              </div>
            </div>

            <div className="border border-inherit/30 p-3 bg-black/40">
              <div className="flex items-center justify-between opacity-70 text-[10px]">
                <span>E2EE & BEVEILIGING</span>
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-base font-bold mt-1 text-emerald-400">
                AES-256-GCM
              </div>
              <div className="text-[10px] opacity-60 mt-1">
                PBKDF2 100k ronden actief
              </div>
            </div>
          </div>

          {/* Emergency Alert Broadcast Panel */}
          <div className="border-2 border-red-500/60 bg-red-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-red-500/40 pb-2">
              <span className="font-bold flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
                <span>NOODNET BROADCAST // SYSTEEMBREDE SPOEDUITZENDING</span>
              </span>
              <span className="text-[10px] opacity-75 text-red-300">ALLEEN SYSOP BEVOEGDHEID</span>
            </div>

            <p className="text-[11px] opacity-80 leading-relaxed">
              Verzend een dringende melding naar alle aangesloten terminalschermen, PWA-notificaties en
              het noodnetkanaal. Activeert een waarschuwingsbeltoon bij actieve gebruikers.
            </p>

            <form onSubmit={handleBroadcast} className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-1">
                  <label className="text-[10px] opacity-70 block mb-1">TITEL NOODBERICHT:</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={e => setBroadcastTitle(e.target.value)}
                    className="w-full bg-black border border-inherit/60 p-2 text-xs font-mono text-inherit outline-none focus:border-red-400"
                    placeholder="Bijv. NOODNET ALARM"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] opacity-70 block mb-1">BERICHTINHOUD:</label>
                  <input
                    type="text"
                    value={broadcastBody}
                    onChange={e => setBroadcastBody(e.target.value)}
                    className="w-full bg-black border border-inherit/60 p-2 text-xs font-mono text-inherit outline-none focus:border-red-400"
                    placeholder="Beschrijving van de noodsituatie of instructie..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[10px] opacity-60">
                  {broadcastSent && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Bericht succesvol verzonden naar alle nodes!
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>ZEND NOODBERICHT UIT</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SubTab 2: User Registry & RBAC */}
      {activeSubTab === 'users' && (
        <div className="border border-inherit/40 bg-black/60 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-inherit/30 pb-2">
            <span className="font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>GEREGISTREERDE WIJKLEDEN & TOEGANGSBEHEER (RBAC)</span>
            </span>
            <span className="text-[11px] opacity-70">{usersList.length} accounts geregistreerd</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse font-mono">
              <thead>
                <tr className="border-b border-inherit/30 opacity-70">
                  <th className="py-1.5 px-2">GEBRUIKER</th>
                  <th className="py-1.5 px-2">CALLSIGN</th>
                  <th className="py-1.5 px-2">ROL</th>
                  <th className="py-1.5 px-2">NODE</th>
                  <th className="py-1.5 px-2">BERICHTEN</th>
                  <th className="py-1.5 px-2">STATUS</th>
                  <th className="py-1.5 px-2">E2EE</th>
                  <th className="py-1.5 px-2 text-right">ACTIE</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id} className="border-b border-inherit/15 hover:bg-white/5">
                    <td className="py-2 px-2 font-bold">{u.username}</td>
                    <td className="py-2 px-2 opacity-80">{u.callsign}</td>
                    <td className="py-2 px-2">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value as any)}
                        className="bg-black border border-inherit/40 px-1 py-0.5 text-[10px] text-inherit outline-none"
                      >
                        <option value="SysOp">SysOp</option>
                        <option value="Moderator">Moderator</option>
                        <option value="Lid">Lid</option>
                        <option value="Gast">Gast</option>
                      </select>
                    </td>
                    <td className="py-2 px-2 tabular-nums">#{u.nodeNumber}</td>
                    <td className="py-2 px-2 tabular-nums">{u.postsCount}</td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold ${
                          u.status === 'actief'
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-600/60'
                            : u.status === 'afwezig'
                            ? 'bg-neutral-800 text-neutral-300'
                            : 'bg-red-950/40 text-red-400 border border-red-600/60'
                        }`}
                      >
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      {u.canEncrypt ? (
                        <span className="text-emerald-400">JA</span>
                      ) : (
                        <span className="opacity-40">NEE</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {u.username !== 'SysOp-Willem' && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id)}
                          className={`px-2 py-0.5 border text-[10px] font-bold ${
                            u.status === 'actief'
                              ? 'border-red-600/60 text-red-400 hover:bg-red-950/30'
                              : 'border-emerald-600/60 text-emerald-400 hover:bg-emerald-950/30'
                          }`}
                        >
                          {u.status === 'actief' ? 'BLOKKEER' : 'DEBLOKKEER'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 3: SysLog & Audit Trail */}
      {activeSubTab === 'syslog' && (
        <div className="border border-inherit/40 bg-black/60 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-inherit/30 pb-2">
            <span className="font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>SYSTEEM AUDIT LOGBOEK (/var/log/bbs-audit.log)</span>
            </span>

            {/* Filter buttons & Actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {['ALL', 'INFO', 'WARN', 'AUTH', 'PACKET', 'CRYPTO'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => {
                    sound.keyClick();
                    setLogFilter(lvl);
                  }}
                  className={`px-2 py-0.5 border text-[10px] ${
                    logFilter === lvl
                      ? 'border-current bg-current text-black font-bold'
                      : 'border-inherit/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  {lvl}
                </button>
              ))}

              <button
                onClick={handleExportLogs}
                className="px-2 py-0.5 border border-inherit/40 hover:bg-white/10 text-[10px] flex items-center gap-1 ml-2"
                title="Download logbestand"
              >
                <Download className="w-3 h-3" />
                <span>EXPORT</span>
              </button>

              <button
                onClick={handleClearLogs}
                className="px-2 py-0.5 border border-red-600/60 text-red-400 hover:bg-red-950/30 text-[10px] flex items-center gap-1"
                title="Wis huidig logboek"
              >
                <Trash2 className="w-3 h-3" />
                <span>WIS</span>
              </button>
            </div>
          </div>

          {/* Log Stream Terminal */}
          <div className="h-80 overflow-y-auto space-y-1.5 pr-2 font-mono text-[11px] bg-black p-3 border border-inherit/30">
            {filteredLogs.length === 0 ? (
              <div className="opacity-50 text-center py-8">Geen logregels voor filter '{logFilter}'.</div>
            ) : (
              filteredLogs.map(log => {
                const badgeColor =
                  log.level === 'WARN'
                    ? 'text-red-400 font-bold'
                    : log.level === 'AUTH'
                    ? 'text-cyan-400'
                    : log.level === 'CRYPTO'
                    ? 'text-emerald-400'
                    : log.level === 'PACKET'
                    ? 'text-amber-400'
                    : 'text-neutral-400';

                return (
                  <div key={log.id} className="flex items-start gap-2 hover:bg-white/5 py-0.5">
                    <span className="opacity-50 select-none shrink-0 tabular-nums">[{log.time}]</span>
                    <span className={`shrink-0 w-16 ${badgeColor}`}>[{log.level}]</span>
                    <span className="flex-1 opacity-90 break-words">{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SubTab 4: Maintenance & Database Tuning */}
      {activeSubTab === 'maintenance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-inherit/40 bg-black/60 p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold border-b border-inherit/30 pb-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>INDEXEDDB DATABASE RE-INDEXEREN</span>
            </div>
            <p className="text-[11px] opacity-75 leading-relaxed">
              Herbouwt de lokale B-Tree indexen voor berichten, discussieborden en outbox-wachtrijen.
              Aanbevolen na grootschalige synchronisatie-activiteiten over het LoRa netwerk.
            </p>
            <button
              onClick={handleReindexDB}
              className="px-4 py-2 border-2 border-inherit hover:bg-white/10 font-bold text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>VOER DATABASE RE-INDEXERING UIT</span>
            </button>
          </div>

          <div className="border border-inherit/40 bg-black/60 p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold border-b border-inherit/30 pb-2 text-amber-400">
              <Sliders className="w-4 h-4" />
              <span>SYSTEEMPARAMETERS & CACHE</span>
            </div>
            <p className="text-[11px] opacity-75 leading-relaxed">
              Ruim voltooide synchronisatietransacties op en ververs de lokale runtime cache.
            </p>
            <button
              onClick={() => {
                sound.bell();
                onDataChange();
              }}
              className="px-4 py-2 border border-inherit/60 hover:bg-white/10 font-bold text-xs flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>CACHE LEGEN & RUNTIME VERVERSEN</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
