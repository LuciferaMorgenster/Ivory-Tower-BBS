/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Board, Post, Reply, TaskItem, SyncConflict, SyncQueueItem, UserSettings, UserAccount } from '../types';
import { ANSI } from './ansi';

const DB_NAME = 'RetroTerminalBBS_DB';
const DB_VERSION = 1;

// Seed initial boards
export const INITIAL_BOARDS: Board[] = [
  {
    id: 'b-general',
    code: 'GEN',
    name: 'General & Town Square',
    description: 'Central gathering hub for announcements and community discussions.',
    category: 'general',
    isEncrypted: false,
    postCount: 1,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b-tech',
    code: 'NET',
    name: 'Hardware & Local Mesh Networks',
    description: 'Off-grid links, LoRaWAN, packet radio, and server operations.',
    category: 'tech',
    isEncrypted: false,
    postCount: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b-local',
    code: 'LOK',
    name: 'Sustainability & Resource Sharing',
    description: 'Solar energy sharing, tool lending, and local projects.',
    category: 'local',
    isEncrypted: false,
    postCount: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b-secure',
    code: 'SEC',
    name: 'Confidential & E2EE Channel',
    description: 'End-to-End encrypted channel for sensitive communications.',
    category: 'secure',
    isEncrypted: true,
    postCount: 0,
    updatedAt: new Date().toISOString(),
  },
];

// Seed initial posts with ANSI codes
export const INITIAL_POSTS: Post[] = [
  {
    id: 'p-online-1',
    boardId: 'b-general',
    author: 'Bastard Operator From Hell (BOFH)',
    callsign: 'BOFH',
    title: 'Ivory Tower BBS is Officially Online!',
    content: `${ANSI.BRIGHT_CYAN}=================================================================${ANSI.RESET}
${ANSI.BRIGHT_YELLOW}   IVORY TOWER BBS // NODE #1 IS OFFICIALLY ONLINE & OPERATIONAL${ANSI.RESET}
${ANSI.BRIGHT_CYAN}=================================================================${ANSI.RESET}

Welcome to ${ANSI.BRIGHT_WHITE}Ivory Tower BBS${ANSI.RESET}! All prior placeholder messages have been
purged from node memory. The system is live, verified, and accepting
connections.

${ANSI.BOLD}${ANSI.BRIGHT_GREEN}[SYSTEM SUMMARY]${ANSI.RESET}
Ivory Tower BBS is an authentic, 100% offline-first Bulletin Board System
engineered for local autonomy, disaster recovery, and resilient community
communication. Operating entirely within your browser via IndexedDB, it requires
no continuous cloud connection and can function over solar power, local Wi-Fi,
or packet radio mesh nodes.

${ANSI.BOLD}Core Features:${ANSI.RESET}
- ${ANSI.YELLOW}100% Offline-First:${ANSI.RESET} Native browser persistence and zero external dependencies.
- ${ANSI.YELLOW}Retro ANSI Terminal:${ANSI.RESET} 16-color VT100 / CP437 box drawing with 5 CRT phosphor themes.
- ${ANSI.YELLOW}End-to-End Encryption:${ANSI.RESET} Client-side AES-256-GCM derived via PBKDF2 with 2FA TOTP.
- ${ANSI.YELLOW}Packet Radio & AFSK:${ANSI.RESET} Bell 202 acoustic audio coupler (1200 baud) & APRS weather.
- ${ANSI.YELLOW}Multilingual Interface:${ANSI.RESET} 8 languages supported with instant header switching.

${ANSI.BOLD}${ANSI.BRIGHT_GREEN}[SOURCE CODE & GITHUB REPOSITORY]${ANSI.RESET}
The complete open-source codebase, architecture documentation, and SysOp
deployment guides are available on GitHub:
${ANSI.BRIGHT_BLUE}https://github.com/luciferamorgenster/ivory-tower-bbs${ANSI.RESET}

${ANSI.BOLD}${ANSI.BRIGHT_RED}[SYSOP DIRECTIVE]${ANSI.RESET}
Respect the baud rates, keep noise off the emergency channels, and do
not attempt to crash my terminal buffers. You have been warned.

${ANSI.BOLD}-- Bastard Operator From Hell (BOFH)${ANSI.RESET}
   SysOp & Supreme Dictator // Ivory Tower BBS Node #1`,
    isEncrypted: false,
    tags: ['online', 'announcement', 'sysop', 'github', 'bofh'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    repliesCount: 0,
    authorNode: 1,
  },
];

export const INITIAL_REPLIES: Reply[] = [];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 't-1',
    title: 'Maintain node battery bank & solar charger',
    description: 'Verify 24V float voltage and terminal connections on main battery rack.',
    assignedTo: 'Bastard Operator From Hell (BOFH)',
    priority: 'high',
    completed: false,
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    category: 'Maintenance',
  },
  {
    id: 't-2',
    title: 'Monitor 869.525 MHz LoRa packet repeater',
    description: 'Check telemetry signal-to-noise ratio and packet traffic logs.',
    assignedTo: 'Bastard Operator From Hell (BOFH)',
    priority: 'normal',
    completed: true,
    dueDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    category: 'Radio',
  },
  {
    id: 't-3',
    title: 'Archive encrypted database to offline media',
    description: 'Perform cold storage snapshot of all Ivory Tower BBS boards.',
    assignedTo: 'Bastard Operator From Hell (BOFH)',
    priority: 'urgent',
    completed: false,
    dueDate: new Date(Date.now() + 86400000 * 1).toISOString().slice(0, 10),
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    category: 'Security',
  },
];

export const DEFAULT_USER: UserAccount = {
  username: 'Bastard Operator From Hell (BOFH)',
  callsign: 'BOFH',
  role: 'SysOp',
  nodeNumber: 1,
  baudRate: 19200,
  mfaEnabled: true,
  mfaSecret: 'JBSWY3DPEHPK3PXP', // Sample Base32 TOTP secret
  biometricRegistered: true,
  joinedAt: '1992-05-01T00:00:00.000Z',
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'amber',
  scanlines: true,
  soundEnabled: true,
  baudSimulation: false,
  language: 'en',
  autoSync: true,
  highContrast: false,
  batterySaver: false,
  fontSize: 'normal',
};

// Local storage key constants
const KEY_BOARDS = 'bbs_boards';
const KEY_POSTS = 'bbs_posts';
const KEY_REPLIES = 'bbs_replies';
const KEY_TASKS = 'bbs_tasks';
const KEY_SYNC_QUEUE = 'bbs_sync_queue';
const KEY_CONFLICTS = 'bbs_conflicts';
const KEY_SETTINGS = 'bbs_settings';
const KEY_USER = 'bbs_user';
const KEY_MNEMONIC = 'bbs_e2ee_mnemonic';

class StorageManager {
  private memoryCache: Map<string, any> = new Map();

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (typeof window === 'undefined') return;

    // One-time migration to clear sample posts and switch SysOp to BOFH
    const MIGRATION_KEY = 'bbs_bofh_online_v1';
    if (!localStorage.getItem(MIGRATION_KEY)) {
      localStorage.setItem(KEY_BOARDS, JSON.stringify(INITIAL_BOARDS));
      localStorage.setItem(KEY_POSTS, JSON.stringify(INITIAL_POSTS));
      localStorage.setItem(KEY_REPLIES, JSON.stringify(INITIAL_REPLIES));
      localStorage.setItem(KEY_TASKS, JSON.stringify(INITIAL_TASKS));
      localStorage.setItem(KEY_USER, JSON.stringify(DEFAULT_USER));
      localStorage.setItem(MIGRATION_KEY, 'true');
    }

    if (!localStorage.getItem(KEY_BOARDS)) {
      localStorage.setItem(KEY_BOARDS, JSON.stringify(INITIAL_BOARDS));
    }
    if (!localStorage.getItem(KEY_POSTS)) {
      localStorage.setItem(KEY_POSTS, JSON.stringify(INITIAL_POSTS));
    }
    if (!localStorage.getItem(KEY_REPLIES)) {
      localStorage.setItem(KEY_REPLIES, JSON.stringify(INITIAL_REPLIES));
    }
    if (!localStorage.getItem(KEY_TASKS)) {
      localStorage.setItem(KEY_TASKS, JSON.stringify(INITIAL_TASKS));
    }
    if (!localStorage.getItem(KEY_SETTINGS)) {
      localStorage.setItem(KEY_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(KEY_USER)) {
      localStorage.setItem(KEY_USER, JSON.stringify(DEFAULT_USER));
    }
    if (!localStorage.getItem(KEY_SYNC_QUEUE)) {
      localStorage.setItem(KEY_SYNC_QUEUE, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEY_CONFLICTS)) {
      localStorage.setItem(KEY_CONFLICTS, JSON.stringify([]));
    }
  }

  // --- BOARDS ---
  public getBoards(): Board[] {
    try {
      const data = localStorage.getItem(KEY_BOARDS);
      return data ? JSON.parse(data) : INITIAL_BOARDS;
    } catch {
      return INITIAL_BOARDS;
    }
  }

  public saveBoard(board: Board): void {
    const boards = this.getBoards();
    const idx = boards.findIndex(b => b.id === board.id);
    if (idx >= 0) {
      boards[idx] = board;
    } else {
      boards.push(board);
    }
    localStorage.setItem(KEY_BOARDS, JSON.stringify(boards));
  }

  // --- POSTS ---
  public getPosts(boardId?: string): Post[] {
    try {
      const data = localStorage.getItem(KEY_POSTS);
      const posts: Post[] = data ? JSON.parse(data) : INITIAL_POSTS;
      if (boardId) {
        return posts.filter(p => p.boardId === boardId);
      }
      return posts;
    } catch {
      return INITIAL_POSTS;
    }
  }

  public getPost(id: string): Post | undefined {
    return this.getPosts().find(p => p.id === id);
  }

  public savePost(post: Post): void {
    const posts = this.getPosts();
    const idx = posts.findIndex(p => p.id === post.id);
    if (idx >= 0) {
      posts[idx] = { ...post, updatedAt: new Date().toISOString(), version: (post.version || 1) + 1 };
    } else {
      posts.unshift({ ...post, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1 });
      // Update board post count
      const boards = this.getBoards();
      const bIdx = boards.findIndex(b => b.id === post.boardId);
      if (bIdx >= 0) {
        boards[bIdx].postCount = (boards[bIdx].postCount || 0) + 1;
        boards[bIdx].updatedAt = new Date().toISOString();
        localStorage.setItem(KEY_BOARDS, JSON.stringify(boards));
      }
    }
    localStorage.setItem(KEY_POSTS, JSON.stringify(posts));
  }

  public deletePost(id: string): void {
    const posts = this.getPosts().filter(p => p.id !== id);
    localStorage.setItem(KEY_POSTS, JSON.stringify(posts));
  }

  // --- REPLIES ---
  public getReplies(postId?: string): Reply[] {
    try {
      const data = localStorage.getItem(KEY_REPLIES);
      const replies: Reply[] = data ? JSON.parse(data) : INITIAL_REPLIES;
      if (postId) {
        return replies.filter(r => r.postId === postId);
      }
      return replies;
    } catch {
      return INITIAL_REPLIES;
    }
  }

  public saveReply(reply: Reply): void {
    const replies = this.getReplies();
    replies.push({ ...reply, createdAt: new Date().toISOString(), version: 1 });
    localStorage.setItem(KEY_REPLIES, JSON.stringify(replies));

    // Update post replies count
    const posts = this.getPosts();
    const pIdx = posts.findIndex(p => p.id === reply.postId);
    if (pIdx >= 0) {
      posts[pIdx].repliesCount = (posts[pIdx].repliesCount || 0) + 1;
      posts[pIdx].updatedAt = new Date().toISOString();
      localStorage.setItem(KEY_POSTS, JSON.stringify(posts));
    }
  }

  // --- TASKS ---
  public getTasks(): TaskItem[] {
    try {
      const data = localStorage.getItem(KEY_TASKS);
      return data ? JSON.parse(data) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  }

  public saveTask(task: TaskItem): void {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = task;
    } else {
      tasks.push(task);
    }
    localStorage.setItem(KEY_TASKS, JSON.stringify(tasks));
  }

  public deleteTask(id: string): void {
    const tasks = this.getTasks().filter(t => t.id !== id);
    localStorage.setItem(KEY_TASKS, JSON.stringify(tasks));
  }

  // --- SETTINGS ---
  public getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(KEY_SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(data);
      if (!localStorage.getItem('bbs_en_default_applied')) {
        localStorage.setItem('bbs_en_default_applied', 'true');
        parsed.language = 'en';
        localStorage.setItem(KEY_SETTINGS, JSON.stringify(parsed));
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: UserSettings): void {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
  }

  // --- USER ACCOUNT ---
  public getUserAccount(): UserAccount {
    try {
      const data = localStorage.getItem(KEY_USER);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.username === 'SysOp-Willem' || !parsed.username) {
          parsed.username = 'Bastard Operator From Hell (BOFH)';
          parsed.callsign = 'BOFH';
          localStorage.setItem(KEY_USER, JSON.stringify(parsed));
        }
        return { ...DEFAULT_USER, ...parsed };
      }
      return DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  }

  public saveUserAccount(user: UserAccount): void {
    localStorage.setItem(KEY_USER, JSON.stringify(user));
  }

  // --- E2EE MNEMONIC ---
  public getCryptoMnemonic(): string | null {
    return localStorage.getItem(KEY_MNEMONIC);
  }

  public saveCryptoMnemonic(mnemonic: string): void {
    localStorage.setItem(KEY_MNEMONIC, mnemonic.trim().toLowerCase());
  }

  // --- SYNC QUEUE & CONFLICTS ---
  public getSyncQueue(): SyncQueueItem[] {
    try {
      const data = localStorage.getItem(KEY_SYNC_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public addSyncQueueItem(item: SyncQueueItem): void {
    const queue = this.getSyncQueue();
    queue.push(item);
    localStorage.setItem(KEY_SYNC_QUEUE, JSON.stringify(queue));
  }

  public removeSyncQueueItem(id: string): void {
    const queue = this.getSyncQueue().filter(q => q.id !== id);
    localStorage.setItem(KEY_SYNC_QUEUE, JSON.stringify(queue));
  }

  public clearSyncQueue(): void {
    localStorage.setItem(KEY_SYNC_QUEUE, JSON.stringify([]));
  }

  public getConflicts(): SyncConflict[] {
    try {
      const data = localStorage.getItem(KEY_CONFLICTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveConflict(conflict: SyncConflict): void {
    const list = this.getConflicts();
    const idx = list.findIndex(c => c.id === conflict.id);
    if (idx >= 0) {
      list[idx] = conflict;
    } else {
      list.unshift(conflict);
    }
    localStorage.setItem(KEY_CONFLICTS, JSON.stringify(list));
  }

  public resolveConflict(id: string, resolutionChoice: 'local' | 'remote' | 'merged'): void {
    const list = this.getConflicts();
    const item = list.find(c => c.id === id);
    if (item) {
      item.resolved = true;
      item.resolutionChoice = resolutionChoice;
      localStorage.setItem(KEY_CONFLICTS, JSON.stringify(list));
    }
  }

  // --- EXPORT & BACKUP ---
  public exportBackupJson(): string {
    const exportData = {
      app: 'Ivory Tower BBS',
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      data: {
        boards: this.getBoards(),
        posts: this.getPosts(),
        replies: this.getReplies(),
        tasks: this.getTasks(),
        user: this.getUserAccount(),
        settings: this.getSettings(),
      },
    };
    return JSON.stringify(exportData, null, 2);
  }

  public importBackupJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data) return false;
      if (parsed.data.boards) localStorage.setItem(KEY_BOARDS, JSON.stringify(parsed.data.boards));
      if (parsed.data.posts) localStorage.setItem(KEY_POSTS, JSON.stringify(parsed.data.posts));
      if (parsed.data.replies) localStorage.setItem(KEY_REPLIES, JSON.stringify(parsed.data.replies));
      if (parsed.data.tasks) localStorage.setItem(KEY_TASKS, JSON.stringify(parsed.data.tasks));
      if (parsed.data.settings) localStorage.setItem(KEY_SETTINGS, JSON.stringify(parsed.data.settings));
      return true;
    } catch {
      return false;
    }
  }

  public resetAll(): void {
    localStorage.clear();
    this.ensureInitialized();
  }
}

export const storage = new StorageManager();
