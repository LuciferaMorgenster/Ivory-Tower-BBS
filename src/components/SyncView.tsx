/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SyncConflict, SyncQueueItem } from '../types';
import { storage } from '../utils/storage';
import { syncEngine, SyncEngineStatus } from '../utils/sync';
import { sound } from '../utils/sound';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  GitMerge,
  ArrowRight,
  Database,
  Clock,
  Sparkles,
} from 'lucide-react';

interface SyncViewProps {
  syncStatus: SyncEngineStatus;
  conflicts: SyncConflict[];
  queue: SyncQueueItem[];
  onTriggerSync: () => void;
  onToggleOffline: () => void;
  onDataChange: () => void;
}

export const SyncView: React.FC<SyncViewProps> = ({
  syncStatus,
  conflicts,
  queue,
  onTriggerSync,
  onToggleOffline,
  onDataChange,
}) => {
  const [activeConflictId, setActiveConflictId] = useState<string | null>(
    conflicts.find(c => !c.resolved)?.id || null
  );

  const unresolvedConflicts = conflicts.filter(c => !c.resolved);
  const activeConflict = conflicts.find(c => c.id === activeConflictId);

  const handleResolve = (conflictId: string, choice: 'local' | 'remote' | 'merged') => {
    sound.execute();
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    if (choice === 'remote') {
      if (conflict.entityType === 'post') {
        storage.savePost(conflict.remoteVersion);
      } else if (conflict.entityType === 'task') {
        storage.saveTask(conflict.remoteVersion);
      }
    } else if (choice === 'merged') {
      if (conflict.entityType === 'post') {
        const merged = {
          ...conflict.localVersion,
          title: conflict.localVersion.title,
          content: `${conflict.localVersion.content}\n\n--- [SAMENGEVOEGD VANUIT REMOTE NODE] ---\n${conflict.remoteVersion.content}`,
          version: Math.max(conflict.localVersion.version || 1, conflict.remoteVersion.version || 1) + 1,
        };
        storage.savePost(merged);
      }
    }
    // If choice === 'local', local version is kept as is

    storage.resolveConflict(conflictId, choice);
    onDataChange();
  };

  const handleSimulateConflict = () => {
    sound.bell();
    const c = syncEngine.simulateIncomingConflict();
    setActiveConflictId(c.id);
    onDataChange();
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Header Card */}
      <div className="border border-inherit/40 p-3 bg-inherit/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold tracking-wider flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
            <span>OFFLINE SYNCHRONISATIE & DATA-CONFLICTOPLOSSING</span>
          </h2>
          <p className="opacity-70 mt-0.5 text-[11px]">
            Robuuste uitgaande wachtrij en automatische versievergelijking voor netwerken met tussenpozen.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.keyClick();
              onToggleOffline();
            }}
            className={`px-3 py-1.5 border font-bold text-xs flex items-center gap-1.5 transition-colors ${
              syncStatus.isOnline
                ? 'border-emerald-600/80 text-emerald-400 hover:bg-emerald-950/30'
                : 'border-amber-600 text-amber-400 bg-amber-950/40 hover:bg-amber-900/50'
            }`}
          >
            {syncStatus.isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{syncStatus.isOnline ? 'ONLINE' : 'OFFLINE MODUS ACTIEF'}</span>
          </button>

          <button
            onClick={() => {
              sound.execute();
              onTriggerSync();
            }}
            disabled={syncStatus.isSyncing || !syncStatus.isOnline}
            className="px-3 py-1.5 bg-current text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
            <span>SYNC NU STARTEN</span>
          </button>
        </div>
      </div>

      {/* Conflicts Alert Section */}
      {unresolvedConflicts.length > 0 && (
        <div className="border-2 border-red-500/80 bg-red-950/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>DATA-CONFLICT GEDETECTEERD ({unresolvedConflicts.length})</span>
            </div>
            <span className="text-[11px] opacity-75">INTERACTIEVE RESOLUTIE VEREIST</span>
          </div>

          <p className="text-xs text-red-200/90 leading-relaxed">
            Een ander netwerkstation (bijvoorbeeld Node #3) heeft gelijktijdig een update doorgevoerd aan hetzelfde record. Kies hieronder welke versie behouden moet blijven of voeg ze samen.
          </p>

          {activeConflict && (
            <div className="border border-red-700/60 bg-black/60 p-3 space-y-3 mt-2">
              <div className="text-xs font-bold text-red-300">
                Conflict in {activeConflict.entityType.toUpperCase()}: <span className="font-mono text-white">{activeConflict.localVersion?.title || activeConflict.entityId}</span>
              </div>

              {/* Side-by-side Version Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Local Version */}
                <div className="border border-inherit/40 p-3 bg-black/40 space-y-2">
                  <div className="font-bold flex items-center justify-between text-emerald-400">
                    <span>LOKALE VERSIE (Deze Node)</span>
                    <span className="text-[10px] opacity-75">v{activeConflict.localVersion?.version || 1}</span>
                  </div>
                  <div className="opacity-80 text-[11px] border-b border-inherit/20 pb-1">
                    Laatst gewijzigd: {new Date(activeConflict.localVersion?.updatedAt || activeConflict.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="font-semibold">{activeConflict.localVersion?.title}</div>
                  <div className="opacity-85 whitespace-pre-wrap max-h-36 overflow-y-auto text-[11px]">
                    {activeConflict.localVersion?.content || activeConflict.localVersion?.description}
                  </div>
                  <button
                    onClick={() => handleResolve(activeConflict.id, 'local')}
                    className="w-full mt-2 py-1.5 border border-emerald-500 text-emerald-400 font-bold hover:bg-emerald-950/40"
                  >
                    BEHOUD LOKALE VERSIE
                  </button>
                </div>

                {/* Remote Version */}
                <div className="border border-inherit/40 p-3 bg-black/40 space-y-2">
                  <div className="font-bold flex items-center justify-between text-amber-400">
                    <span>REMOTE VERSIE (Inkomende Node)</span>
                    <span className="text-[10px] opacity-75">v{activeConflict.remoteVersion?.version || 2}</span>
                  </div>
                  <div className="opacity-80 text-[11px] border-b border-inherit/20 pb-1">
                    Laatst gewijzigd: {new Date(activeConflict.remoteVersion?.updatedAt || activeConflict.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="font-semibold">{activeConflict.remoteVersion?.title}</div>
                  <div className="opacity-85 whitespace-pre-wrap max-h-36 overflow-y-auto text-[11px]">
                    {activeConflict.remoteVersion?.content || activeConflict.remoteVersion?.description}
                  </div>
                  <button
                    onClick={() => handleResolve(activeConflict.id, 'remote')}
                    className="w-full mt-2 py-1.5 border border-amber-500 text-amber-400 font-bold hover:bg-amber-950/40"
                  >
                    GEBRUIK REMOTE VERSIE
                  </button>
                </div>
              </div>

              {/* Merge Button */}
              {activeConflict.entityType === 'post' && (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => handleResolve(activeConflict.id, 'merged')}
                    className="px-4 py-1.5 bg-neutral-800 border border-neutral-600 text-white font-bold hover:bg-neutral-700 flex items-center gap-1.5 mx-auto"
                  >
                    <GitMerge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>VOEG BEIDE VERSIES SAMEN (MERGE)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Outbox Sync Queue Section */}
      <div className="border border-inherit/40 p-4 bg-black/30 space-y-3">
        <div className="flex items-center justify-between border-b border-inherit/30 pb-2">
          <div className="font-bold flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span>UITGAANDE SYNCHRONISATIE WACHTRIJ (OUTBOX: {queue.length})</span>
          </div>
          <button
            onClick={handleSimulateConflict}
            className="px-2.5 py-1 border border-inherit/40 hover:bg-white/10 text-[11px] flex items-center gap-1"
            title="Genereer een testconflict om de conflictresolutie-interface uit te proberen"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>SIMULEER TESTCONFLICT</span>
          </button>
        </div>

        {queue.length === 0 ? (
          <div className="p-4 border border-dashed border-inherit/30 text-center opacity-65 text-xs">
            Geen wachtende uitgaande berichten. Alle lokale wijzigingen zijn synchroon met de opslag!
          </div>
        ) : (
          <div className="space-y-1.5">
            {queue.map(item => (
              <div
                key={item.id}
                className="p-2 border border-inherit/25 bg-black/40 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 border text-[10px] uppercase font-bold">
                    {item.action}
                  </span>
                  <span>{item.entityType.toUpperCase()}:</span>
                  <span className="font-bold truncate max-w-[200px] sm:max-w-xs">
                    {item.payload?.title || item.entityId}
                  </span>
                </div>
                <div className="opacity-60 text-[11px]">
                  Wacht op verzending...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Architecture Info Box */}
      <div className="border border-inherit/30 p-3 bg-black/20 text-[11px] space-y-1.5 opacity-80">
        <div className="font-bold">HOE OFFLINE SYNCHRONISATIE WERKT:</div>
        <p>
          1. Wanneer de BBS offline is, worden alle posts, reacties en taken direct lokaal in IndexedDB bewaard en aan de Outbox toegevoegd.
        </p>
        <p>
          2. Zodra verbinding met een peer node of internet wordt hersteld, worden alle wijzigingen chronologisch verzonden.
        </p>
        <p>
          3. Conflicterende edits worden onderschept aan de hand van versie-stempels en kunnen interactief per veld worden samengevoegd.
        </p>
      </div>
    </div>
  );
};
