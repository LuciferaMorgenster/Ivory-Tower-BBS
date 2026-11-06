/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TerminalTheme = 'green' | 'amber' | 'dos' | 'modern-dark' | 'modern-light';

export type UserRole = 'SysOp' | 'Moderator' | 'Member' | 'Guest';

export interface UserAccount {
  username: string;
  callsign: string;
  role: UserRole;
  nodeNumber: number;
  baudRate: number;
  mfaEnabled: boolean;
  mfaSecret?: string;
  biometricRegistered: boolean;
  e2eeFingerprint?: string;
  avatarSeed?: string;
  joinedAt: string;
}

export interface Board {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'general' | 'tech' | 'local' | 'secure';
  isEncrypted: boolean;
  postCount: number;
  updatedAt: string;
}

export interface Post {
  id: string;
  boardId: string;
  author: string;
  callsign: string;
  title: string;
  content: string; // Plain text or ANSI-coded content
  isEncrypted: boolean;
  encryptedPayload?: string; // Base64 ciphertext if E2EE
  tags: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
  repliesCount: number;
  authorNode?: number;
}

export interface Reply {
  id: string;
  postId: string;
  author: string;
  callsign: string;
  content: string;
  isEncrypted: boolean;
  encryptedPayload?: string;
  createdAt: string;
  version: number;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  completed: boolean;
  dueDate: string;
  createdAt: string;
  category: string;
}

export interface SyncConflict {
  id: string;
  entityType: 'post' | 'reply' | 'task';
  entityId: string;
  localVersion: any;
  remoteVersion: any;
  timestamp: string;
  resolved: boolean;
  resolutionChoice?: 'local' | 'remote' | 'merged';
}

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  entityType: 'post' | 'reply' | 'task';
  entityId: string;
  payload: any;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
}

export interface SystemStats {
  totalPosts: number;
  totalBoards: number;
  totalReplies: number;
  totalTasks: number;
  encryptedPostsCount: number;
  activeNodes: number;
  storageUsageBytes: number;
  lastSyncTime: string;
  syncQueuePending: number;
  unresolvedConflicts: number;
}

import { SupportedLanguage } from './utils/i18n';

export interface UserSettings {
  theme: TerminalTheme;
  scanlines: boolean;
  soundEnabled: boolean;
  baudSimulation: boolean;
  language: SupportedLanguage;
  autoSync: boolean;
  highContrast: boolean;
  batterySaver: boolean;
  fontSize: 'normal' | 'large' | 'huge';
}
