/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SyncConflict, SyncQueueItem, Post, TaskItem } from '../types';
import { storage } from './storage';
import { sound } from './sound';

export interface SyncEngineStatus {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  conflictCount: number;
}

class SyncEngine {
  private isSimulatedOffline = false;
  private isSyncing = false;
  private lastSyncAt: string | null = null;
  private listeners: Array<(status: SyncEngineStatus) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange());
      window.addEventListener('offline', () => this.handleNetworkChange());
    }
  }

  public subscribe(listener: (status: SyncEngineStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach(l => l(status));
  }

  public getStatus(): SyncEngineStatus {
    const isActuallyOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const isOnline = isActuallyOnline && !this.isSimulatedOffline;
    const queue = storage.getSyncQueue();
    const conflicts = storage.getConflicts().filter(c => !c.resolved);

    return {
      isOnline,
      isSimulatedOffline: this.isSimulatedOffline,
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
      pendingCount: queue.length,
      conflictCount: conflicts.length,
    };
  }

  public toggleSimulatedOffline(): boolean {
    this.isSimulatedOffline = !this.isSimulatedOffline;
    this.notify();
    if (!this.isSimulatedOffline) {
      this.triggerSync();
    }
    return this.isSimulatedOffline;
  }

  private handleNetworkChange() {
    this.notify();
    if (this.getStatus().isOnline) {
      this.triggerSync();
    }
  }

  /**
   * Triggers synchronization of the local outbox queue with simulated remote BBS nodes.
   */
  public async triggerSync(): Promise<{ success: boolean; syncedCount: number; conflictsCreated: number }> {
    if (this.isSyncing) return { success: false, syncedCount: 0, conflictsCreated: 0 };
    const status = this.getStatus();
    if (!status.isOnline) {
      return { success: false, syncedCount: 0, conflictsCreated: 0 };
    }

    this.isSyncing = true;
    this.notify();

    let syncedCount = 0;
    let conflictsCreated = 0;

    try {
      // Simulate network latency (0.8s)
      await new Promise(res => setTimeout(res, 800));

      const queue = storage.getSyncQueue();

      for (const item of queue) {
        // Random check to simulate realistic concurrent edit conflict on old items (1 in 5 chance)
        if (item.action === 'update' && Math.random() < 0.2) {
          const conflict: SyncConflict = {
            id: `conf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            entityType: item.entityType,
            entityId: item.entityId,
            localVersion: item.payload,
            remoteVersion: {
              ...item.payload,
              title: `${item.payload.title || 'Gewijzigd'} (Door Node #4)`,
              content: `${item.payload.content || ''}\n\n[OPMERKING: Node #4 heeft gelijktijdig een update doorgevoerd]`,
              updatedAt: new Date().toISOString(),
              version: (item.payload.version || 1) + 2,
            },
            timestamp: new Date().toISOString(),
            resolved: false,
          };
          storage.saveConflict(conflict);
          conflictsCreated++;
          storage.removeSyncQueueItem(item.id);
        } else {
          // Successfully synced item
          storage.removeSyncQueueItem(item.id);
          syncedCount++;
        }
      }

      this.lastSyncAt = new Date().toISOString();
      sound.execute();
    } catch (err) {
      sound.errorBeep();
    } finally {
      this.isSyncing = false;
      this.notify();
    }

    return { success: true, syncedCount, conflictsCreated };
  }

  /**
   * Simulates receiving a remote conflicting update to demonstrate conflict resolution UI.
   */
  public simulateIncomingConflict(): SyncConflict {
    const posts = storage.getPosts();
    const targetPost = posts[0] || {
      id: 'p-sim',
      title: 'Local Emergency Generator',
      content: 'Original local post content.',
      author: 'Bastard Operator From Hell (BOFH)',
      version: 1,
    };

    const conflict: SyncConflict = {
      id: `conf-sim-${Date.now()}`,
      entityType: 'post',
      entityId: targetPost.id,
      localVersion: {
        ...targetPost,
        content: targetPost.content + '\n[Lokale wijziging: oliepeil nagekeken]',
        updatedAt: new Date().toISOString(),
      },
      remoteVersion: {
        ...targetPost,
        content: targetPost.content + '\n[Remote Node #3: startmotor vervangen om 14:00]',
        updatedAt: new Date(Date.now() - 300000).toISOString(),
        version: (targetPost.version || 1) + 1,
      },
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    storage.saveConflict(conflict);
    this.notify();
    sound.bell();
    return conflict;
  }
}

export const syncEngine = new SyncEngine();
