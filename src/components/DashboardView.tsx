/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Board, Post, Reply, TaskItem, UserAccount } from '../types';
import { storage } from '../utils/storage';
import { sound } from '../utils/sound';
import { exportPostsToCsv, printRetroPdfReport } from '../utils/exporter';
import {
  BarChart3,
  HardDrive,
  Shield,
  Activity,
  Layers,
  Download,
  Upload,
  Printer,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

interface DashboardViewProps {
  boards: Board[];
  posts: Post[];
  replies: Reply[];
  tasks: TaskItem[];
  user: UserAccount;
  onDataChange: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  boards,
  posts,
  replies,
  tasks,
  user,
  onDataChange,
}) => {
  // Widget customization toggles
  const [showKpis, setShowKpis] = useState(true);
  const [showBoardDist, setShowBoardDist] = useState(true);
  const [showActivityLog, setShowActivityLog] = useState(true);
  const [showBackupControls, setShowBackupControls] = useState(true);

  // Compute metrics
  const totalPosts = posts.length;
  const totalReplies = replies.length;
  const encryptedPosts = posts.filter(p => p.isEncrypted).length;
  const encryptedRatio = totalPosts > 0 ? Math.round((encryptedPosts / totalPosts) * 100) : 0;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.length - completedTasks;

  // Approximate storage calculation
  const storageUsageKb = useMemo(() => {
    const raw = storage.exportBackupJson();
    return (raw.length / 1024).toFixed(1);
  }, [posts, replies, tasks, boards]);

  // Activity breakdown per board
  const boardDistribution = useMemo(() => {
    return boards.map(b => {
      const count = posts.filter(p => p.boardId === b.id).length;
      const pct = totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0;
      return { board: b, count, pct };
    });
  }, [boards, posts, totalPosts]);

  // Export full JSON backup
  const handleExportBackup = () => {
    sound.execute();
    const jsonStr = storage.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bbs_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (content) {
        const success = storage.importBackupJson(content);
        if (success) {
          sound.execute();
          alert('Back-up succesvol hersteld!');
          onDataChange();
        } else {
          sound.errorBeep();
          alert('Fout: ongeldig back-up bestand.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Print PDF system report
  const handlePrintSystemReport = () => {
    sound.execute();
    const boardRows = boardDistribution
      .map(
        d => `<tr>
          <td>[${d.board.code}] ${d.board.name}</td>
          <td>${d.count} berichten</td>
          <td>${d.pct}%</td>
          <td>${d.board.isEncrypted ? 'E2EE Beveiligd' : 'Openbaar'}</td>
        </tr>`
      )
      .join('');

    const contentHtml = `
      <h3>Systeemoverzicht & Data-Analyse</h3>
      <p>
        <strong>Totaal Berichten:</strong> ${totalPosts} · 
        <strong>Reacties:</strong> ${totalReplies} · 
        <strong>E2EE Versleuteld:</strong> ${encryptedPosts} (${encryptedRatio}%) · 
        <strong>Taken Te Doen:</strong> ${pendingTasks}
      </p>
      <table>
        <thead>
          <tr>
            <th>Discussiebord</th>
            <th>Aantal Berichten</th>
            <th>Aandeel</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>${boardRows}</tbody>
      </table>
    `;
    printRetroPdfReport('BBS Analytics Systeemrapport', contentHtml);
  };

  return (
    <div className="space-y-4">
      {/* Dashboard Header & Widget Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-inherit/40 p-3 bg-inherit/5">
        <div>
          <h2 className="text-sm font-bold tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span>DATA-ANALYSE, SYSTEEMSTATISTIEKEN & RAPPORTAGE</span>
          </h2>
          <p className="text-xs opacity-70 mt-0.5">
            Realtime inzicht in lokale discussies, E2EE-verhoudingen en schijfgebruik.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => {
              sound.keyClick();
              exportPostsToCsv(posts, boards);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-inherit/40 hover:bg-white/10"
            title="Download CSV export van alle discussies"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>

          <button
            onClick={handlePrintSystemReport}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-inherit/40 hover:bg-white/10"
            title="Systeemrapport genereren en afdrukken / PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>EXPORT PDF</span>
          </button>
        </div>
      </div>

      {/* Customizable Widgets Selector Bar */}
      <div className="flex items-center gap-2 p-2 border border-inherit/30 bg-black/20 text-[11px] overflow-x-auto select-none">
        <SlidersHorizontal className="w-3.5 h-3.5 opacity-60 mr-1 shrink-0" />
        <span className="opacity-60 mr-2 shrink-0">WIDGETS AANPASSEN:</span>
        <label className="flex items-center gap-1.5 cursor-pointer opacity-80 hover:opacity-100 shrink-0">
          <input
            type="checkbox"
            checked={showKpis}
            onChange={e => setShowKpis(e.target.checked)}
            className="accent-current"
          />
          <span>Kerncijfers</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer opacity-80 hover:opacity-100 shrink-0">
          <input
            type="checkbox"
            checked={showBoardDist}
            onChange={e => setShowBoardDist(e.target.checked)}
            className="accent-current"
          />
          <span>Bordverdeling</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer opacity-80 hover:opacity-100 shrink-0">
          <input
            type="checkbox"
            checked={showActivityLog}
            onChange={e => setShowActivityLog(e.target.checked)}
            className="accent-current"
          />
          <span>Node Gezondheid</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer opacity-80 hover:opacity-100 shrink-0">
          <input
            type="checkbox"
            checked={showBackupControls}
            onChange={e => setShowBackupControls(e.target.checked)}
            className="accent-current"
          />
          <span>Back-up Beheer</span>
        </label>
      </div>

      {/* Widget 1: KPI Stats Grid */}
      {showKpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="border border-inherit/40 p-3 bg-black/30 space-y-1">
            <div className="flex items-center justify-between opacity-70 text-[11px]">
              <span>TOTAAL DISCUSSIES</span>
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl sm:text-2xl font-bold tabular-nums">
              {totalPosts}
            </div>
            <div className="text-[10px] opacity-60">
              +{totalReplies} reacties in omloop
            </div>
          </div>

          <div className="border border-inherit/40 p-3 bg-black/30 space-y-1">
            <div className="flex items-center justify-between opacity-70 text-[11px]">
              <span>E2EE VERSLEUTELD</span>
              <Shield className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold tabular-nums text-amber-400">
              {encryptedRatio}%
            </div>
            <div className="text-[10px] opacity-60">
              {encryptedPosts} beveiligde berichten
            </div>
          </div>

          <div className="border border-inherit/40 p-3 bg-black/30 space-y-1">
            <div className="flex items-center justify-between opacity-70 text-[11px]">
              <span>OPEN TAAKPUNTEN</span>
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl sm:text-2xl font-bold tabular-nums">
              {pendingTasks}
            </div>
            <div className="text-[10px] opacity-60">
              {completedTasks} taken afgerond
            </div>
          </div>

          <div className="border border-inherit/40 p-3 bg-black/30 space-y-1">
            <div className="flex items-center justify-between opacity-70 text-[11px]">
              <span>LOKALE OPSLAG</span>
              <HardDrive className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl sm:text-2xl font-bold tabular-nums">
              {storageUsageKb} KB
            </div>
            <div className="text-[10px] opacity-60">
              IndexedDB cache actief
            </div>
          </div>
        </div>
      )}

      {/* Widget 2: Board Distribution ASCII Bar Chart */}
      {showBoardDist && (
        <div className="border border-inherit/40 p-4 bg-black/30 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-inherit/30 pb-2 text-xs">
            <span className="font-bold tracking-wide">
              BERICHTENVERDELING PER KANAAL (ASCII BAR CHART)
            </span>
            <span className="opacity-60 tabular-nums">100% = {totalPosts} posts</span>
          </div>

          <div className="space-y-2 text-xs">
            {boardDistribution.map(item => {
              const barLength = Math.max(1, Math.round(item.pct / 4));
              const barStr = '█'.repeat(barLength).padEnd(25, '░');

              return (
                <div key={item.board.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 sm:col-span-3 truncate text-[11px]">
                    [{item.board.code}] {item.board.name}
                  </div>
                  <div className="col-span-6 sm:col-span-7 font-mono text-[11px] opacity-90 truncate">
                    <span className="text-current">{barStr}</span>
                  </div>
                  <div className="col-span-2 text-right tabular-nums text-[11px] opacity-80">
                    {item.pct}% ({item.count})
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Widget 3: Node Health & Mesh Telemetry */}
      {showActivityLog && (
        <div className="border border-inherit/40 p-4 bg-black/30 space-y-3 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-inherit/30 pb-2">
            <span className="font-bold tracking-wide">
              LOKALE MESH NETWERKSTATUS & NODES
            </span>
            <span className="opacity-60">STATUS: NOMINAAL</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
            <div className="border border-inherit/30 p-2.5 space-y-1">
              <div className="font-bold flex items-center justify-between">
                <span>Node #1 (Deze Machine)</span>
                <span className="text-emerald-400">[ACTIEF]</span>
              </div>
              <div className="opacity-75">SysOp: Willem · PA3BBS</div>
              <div className="opacity-60">Snelheid: 19200 Baud · Sync: Lokaal</div>
            </div>

            <div className="border border-inherit/30 p-2.5 space-y-1">
              <div className="font-bold flex items-center justify-between">
                <span>Node #2 (Buurthuis)</span>
                <span className="text-emerald-400">[BEREIKBAAR]</span>
              </div>
              <div className="opacity-75">Operator: Anouk_K</div>
              <div className="opacity-60">Verbinding: LoRa 869 MHz · RSSI: -84dBm</div>
            </div>

            <div className="border border-inherit/30 p-2.5 space-y-1">
              <div className="font-bold flex items-center justify-between">
                <span>Node #3 (Watertoren Repeater)</span>
                <span className="text-emerald-400">[REPEATER]</span>
              </div>
              <div className="opacity-75">Operator: Kees_Mesh</div>
              <div className="opacity-60">Zonne-accu: 4.12V · Stand-by</div>
            </div>
          </div>
        </div>
      )}

      {/* Widget 4: Automated Backups & Restore */}
      {showBackupControls && (
        <div className="border border-inherit/40 p-4 bg-black/30 space-y-3 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-inherit/30 pb-2">
            <span className="font-bold tracking-wide">
              GEAUTOMATISEERDE BACK-UPS & RESTORE ARCHIEF
            </span>
            <span className="opacity-60">LOKAAL & VEILIG</span>
          </div>

          <p className="text-xs opacity-75 leading-relaxed">
            Exporteer de volledige BBS-database inclusief alle borden, discussies, reacties, taken en encryptie-instellingen naar een enkel JSON-bestand voor veilige bewaring op USB-stations of off-site media.
          </p>

          <div className="flex items-center gap-3 flex-wrap pt-1">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3 py-2 bg-current text-black font-bold text-xs hover:opacity-90"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD VOLLEDIGE BACK-UP (.JSON)</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-2 border border-inherit/40 hover:bg-white/10 cursor-pointer text-xs">
              <Upload className="w-3.5 h-3.5" />
              <span>HERSTEL VANAF BESTAND</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
