/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  TerminalTheme,
  UserSettings,
  UserAccount,
  Board,
  Post,
  Reply,
  TaskItem,
  SyncConflict,
  SyncQueueItem,
} from './types';
import { storage } from './utils/storage';
import { sound } from './utils/sound';
import { syncEngine, SyncEngineStatus } from './utils/sync';
import { TerminalHeader } from './components/TerminalHeader';
import { CommandLine } from './components/CommandLine';
import { BoardView } from './components/BoardView';
import { TaskView } from './components/TaskView';
import { DashboardView } from './components/DashboardView';
import { SyncView } from './components/SyncView';
import { ApiPlaygroundView } from './components/ApiPlaygroundView';
import { SecurityModal } from './components/SecurityModal';
import { HelpView } from './components/HelpView';
import { DoorGamesView } from './components/DoorGamesView';
import { FileLibraryView } from './components/FileLibraryView';
import { PacketChatView } from './components/PacketChatView';
import { SysOpPanelView } from './components/SysOpPanelView';
import { StarterGuideModal } from './components/StarterGuideModal';
import { NotificationDrawer, BbsNotification } from './components/NotificationDrawer';

const INITIAL_NOTIFICATIONS: BbsNotification[] = [
  {
    id: 'n-1',
    title: 'Ivory Tower BBS Node #1 Online',
    body: 'SysOp Bastard Operator From Hell (BOFH) has brought Ivory Tower BBS online. All systems nominal.',
    timestamp: 'Just now',
    type: 'alert',
    read: false,
  },
  {
    id: 'n-2',
    title: 'Meshtastic Repeater Online',
    body: 'Node #3 (Water Tower) reports excellent telemetry reception (RSSI -84 dBm).',
    timestamp: 'Today',
    type: 'mesh',
    read: false,
  },
  {
    id: 'n-3',
    title: 'Battery Rack Check Scheduled',
    body: 'Reminder: Float charge inspection for 24V emergency battery rack in 3 days.',
    timestamp: 'Yesterday',
    type: 'task',
    read: true,
  },
];

export default function App() {
  // Application state
  const [settings, setSettings] = useState<UserSettings>(() => storage.getSettings());
  const [user, setUser] = useState<UserAccount>(() => storage.getUserAccount());
  const [boards, setBoards] = useState<Board[]>(() => storage.getBoards());
  const [posts, setPosts] = useState<Post[]>(() => storage.getPosts());
  const [replies, setReplies] = useState<Reply[]>(() => storage.getReplies());
  const [tasks, setTasks] = useState<TaskItem[]>(() => storage.getTasks());
  const [conflicts, setConflicts] = useState<SyncConflict[]>(() => storage.getConflicts());
  const [queue, setQueue] = useState<SyncQueueItem[]>(() => storage.getSyncQueue());

  const [activeTab, setActiveTab] = useState<string>('boards');
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isStarterGuideOpen, setIsStarterGuideOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<BbsNotification[]>(INITIAL_NOTIFICATIONS);
  const [syncStatus, setSyncStatus] = useState<SyncEngineStatus>(() => syncEngine.getStatus());

  // Reload data from storage
  const reloadData = useCallback(() => {
    setBoards(storage.getBoards());
    setPosts(storage.getPosts());
    setReplies(storage.getReplies());
    setTasks(storage.getTasks());
    setConflicts(storage.getConflicts());
    setQueue(storage.getSyncQueue());
    setSyncStatus(syncEngine.getStatus());
  }, []);

  // Subscribe to sync engine status
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe(newStatus => {
      setSyncStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  // Update theme on documentElement for dark mode / custom styles
  useEffect(() => {
    sound.setEnabled(settings.soundEnabled);
    if (settings.theme === 'modern-light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [settings.theme, settings.soundEnabled]);

  // Update settings handler
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    storage.saveSettings(updated);
  };

  // Trigger sync handler
  const handleTriggerSync = async () => {
    const res = await syncEngine.triggerSync();
    reloadData();
    if (res.conflictsCreated > 0) {
      setActiveTab('sync');
    }
  };

  // Toggle offline simulator
  const handleToggleOffline = () => {
    syncEngine.toggleSimulatedOffline();
    reloadData();
  };

  // CLI Command Processor
  const handleExecuteCommand = (rawCommand: string): { success: boolean; message: string } => {
    const cmd = rawCommand.trim().toLowerCase();
    const parts = cmd.split(' ');
    const mainVerb = parts[0];
    const arg = parts.slice(1).join(' ');

    const isNl = settings.language === 'nl';

    switch (mainVerb) {
      case 'help':
      case 'h':
      case '?':
      case 'man':
        setActiveTab('help');
        return {
          success: true,
          message: isNl
            ? "Help-handleiding geopend. Typ 'boards' om terug te keren."
            : "Help manual opened. Type 'boards' to return.",
        };

      case 'tour':
      case 'guide':
      case 'start':
      case 'gids':
        setIsStarterGuideOpen(true);
        return {
          success: true,
          message: isNl ? 'Interactieve startersgids geopend.' : 'Interactive onboarding guide opened.',
        };

      case 'boards':
      case 'b':
      case 'posts':
        setActiveTab('boards');
        return {
          success: true,
          message: isNl ? 'BBS discussieborden geladen.' : 'BBS discussion boards loaded.',
        };

      case 'chat':
      case 'packet':
      case 'radio':
      case 'tx':
      case 'wx':
      case 'weather':
      case 'weer':
      case 'aprs':
      case 'freq':
      case 'frequencies':
      case 'afsk':
        setActiveTab('chat');
        return {
          success: true,
          message: isNl
            ? 'Packet radio, APRS weerstation en noodfrequenties geopend.'
            : 'Packet radio, APRS weather station, and emergency frequencies opened.',
        };

      case 'doors':
      case 'door':
      case 'games':
      case 'game':
      case 'trivia':
      case 'ansipaint':
        setActiveTab('doors');
        return {
          success: true,
          message: isNl ? 'BBS Door utilities & spellen geopend.' : 'BBS Door utilities & games opened.',
        };

      case 'files':
      case 'file':
      case 'xmodem':
      case 'dl':
      case 'download':
        setActiveTab('files');
        return {
          success: true,
          message: isNl
            ? 'Bestandenbibliotheek en XMODEM overdracht geopend.'
            : 'File library and XMODEM transfer opened.',
        };

      case 'tasks':
      case 't':
      case 'todo':
        setActiveTab('tasks');
        return {
          success: true,
          message: isNl ? 'Gemeenschapstakenoverzicht geopend.' : 'Community tasks opened.',
        };

      case 'calendar':
      case 'agenda':
      case 'ics':
        setActiveTab('tasks');
        return {
          success: true,
          message: isNl
            ? 'Navigeer naar taken om te synchroniseren met uw agenda (.ics).'
            : 'Navigate to tasks to sync with your external calendar (.ics).',
        };

      case 'dashboard':
      case 'stats':
      case 'd':
        setActiveTab('dashboard');
        return {
          success: true,
          message: isNl
            ? 'Data-analyse en systeemdashboard geladen.'
            : 'Data analytics and system metrics loaded.',
        };

      case 'sync':
      case 's':
        if (arg === 'now') {
          handleTriggerSync();
          return {
            success: true,
            message: isNl
              ? 'Synchronisatie met netwerknodes gestart...'
              : 'Synchronization with mesh nodes triggered...',
          };
        }
        setActiveTab('sync');
        return {
          success: true,
          message: isNl
            ? 'Synchronisatie- en conflictresolutiecentrum geopend.'
            : 'Synchronization & conflict resolution center opened.',
        };

      case 'post':
      case 'p':
      case 'new':
        setActiveTab('boards');
        return {
          success: true,
          message: isNl
            ? 'Klik op [NIEUW BERICHT PLAATSEN] om uw discussie te starten.'
            : "Click '[COMPOSE NEW POST]' to begin writing.",
        };

      case 'theme':
        if (arg === 'amber') {
          handleUpdateSettings({ theme: 'amber' });
          return {
            success: true,
            message: isNl ? 'Thema ingesteld op Amber CRT.' : 'Theme switched to Amber CRT Phosphor.',
          };
        } else if (arg === 'green') {
          handleUpdateSettings({ theme: 'green' });
          return {
            success: true,
            message: isNl ? 'Thema ingesteld op Groen CRT Phosphor.' : 'Theme switched to Green CRT Phosphor.',
          };
        } else if (arg === 'dos') {
          handleUpdateSettings({ theme: 'dos' });
          return {
            success: true,
            message: isNl ? 'Thema ingesteld op Classic DOS 16-kleuren.' : 'Theme switched to Classic DOS 16-color.',
          };
        } else if (arg === 'dark' || arg === 'modern-dark') {
          handleUpdateSettings({ theme: 'modern-dark' });
          return {
            success: true,
            message: isNl ? 'Thema ingesteld op Modern Monospace Donker.' : 'Theme switched to Modern Monospace Dark.',
          };
        } else if (arg === 'light' || arg === 'modern-light') {
          handleUpdateSettings({ theme: 'modern-light' });
          return {
            success: true,
            message: isNl ? 'Thema ingesteld op Modern Monospace Licht.' : 'Theme switched to Modern Monospace Light.',
          };
        } else {
          return {
            success: false,
            message: isNl
              ? "Onbekend thema. Kies uit: 'theme amber', 'theme green', 'theme dos', 'theme dark', 'theme light'"
              : "Unknown theme. Choose from: 'theme amber', 'theme green', 'theme dos', 'theme dark', 'theme light'",
          };
        }

      case 'e2ee':
      case 'crypto':
      case 'keys':
      case 'mfa':
      case 'security':
      case 'sec':
        setIsSecurityOpen(true);
        return {
          success: true,
          message: isNl
            ? 'Beveiligings-, E2EE- en 2FA-beheer geopend.'
            : 'Security, E2EE, and 2FA credentials panel opened.',
        };

      case 'api':
      case 'curl':
        setActiveTab('api');
        return {
          success: true,
          message: isNl
            ? 'REST API client documentatie & sandbox geopend.'
            : 'REST API client documentation & sandbox opened.',
        };

      case 'sysop':
      case 'admin':
      case 'root':
      case 'log':
      case 'syslog':
      case 'audit':
        setActiveTab('sysop');
        return {
          success: true,
          message: isNl ? 'SysOp Beheerdersconsole geopend.' : 'SysOp Administration Console opened.',
        };

      case 'scanlines':
        handleUpdateSettings({ scanlines: !settings.scanlines });
        return {
          success: true,
          message: isNl
            ? `CRT Scanlijnen ${!settings.scanlines ? 'ingeschakeld' : 'uitgeschakeld'}.`
            : `CRT Scanlines ${!settings.scanlines ? 'enabled' : 'disabled'}.`,
        };

      case 'sound':
        handleUpdateSettings({ soundEnabled: !settings.soundEnabled });
        return {
          success: true,
          message: isNl
            ? `Geluidseffecten ${!settings.soundEnabled ? 'ingeschakeld' : 'uitgeschakeld'}.`
            : `Sound effects ${!settings.soundEnabled ? 'enabled' : 'muted'}.`,
        };

      case 'dial':
      case 'modem':
        sound.playModemDialingSequence();
        return {
          success: true,
          message: isNl
            ? 'Vintage modem inbelsequentie wordt afgespeeld (Kiezen + DTMF + Handshake)...'
            : 'Vintage acoustic coupler modem dialing sequence playing...',
        };

      case 'offline':
        handleToggleOffline();
        return {
          success: true,
          message: isNl ? 'Offline airgap-simulatie geschakeld.' : 'Simulated offline air-gap toggled.',
        };

      case 'export':
      case 'backup':
        setActiveTab('dashboard');
        return {
          success: true,
          message: isNl
            ? 'Navigeer naar het dashboard om een back-up of export te downloaden.'
            : 'Navigate to dashboard to download backups and exports.',
        };

      case 'clear':
      case 'cls':
        return {
          success: true,
          message: isNl ? 'Terminalscherm gewist.' : 'Terminal display cleared.',
        };

      default:
        return {
          success: false,
          message: isNl
            ? `Onbekende opdracht '${rawCommand}'. Typ 'help' voor een lijst van alle commando's.`
            : `Unknown command '${rawCommand}'. Type 'help' for directory of commands.`,
        };
    }
  };

  // Theme container classes
  const themeContainerClasses: Record<TerminalTheme, string> = {
    green: 'bg-neutral-950 text-emerald-400 selection:bg-emerald-800 selection:text-black',
    amber: 'bg-neutral-950 text-amber-400 selection:bg-amber-800 selection:text-black',
    dos: 'bg-blue-950 text-neutral-100 selection:bg-neutral-300 selection:text-blue-950',
    'modern-dark': 'bg-neutral-900 text-neutral-200 selection:bg-neutral-700 selection:text-white',
    'modern-light': 'bg-neutral-50 text-neutral-900 selection:bg-neutral-300 selection:text-black',
  };

  const fontSizeClass =
    settings.fontSize === 'huge' ? 'text-sm' : settings.fontSize === 'large' ? 'text-[13px]' : 'text-xs';
  const scanlinesClass =
    settings.scanlines && !settings.batterySaver ? 'crt-scanlines' : '';

  return (
    <div
      className={`min-h-screen flex flex-col font-mono ${fontSizeClass} transition-colors duration-150 crt-screen ${scanlinesClass} ${themeContainerClasses[settings.theme]}`}
    >
      {/* Top Status Header */}
      <TerminalHeader
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        user={user}
        syncStatus={syncStatus}
        onTriggerSync={handleTriggerSync}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onToggleSimulatedOffline={handleToggleOffline}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadNotificationsCount={notifications.filter(n => !n.read).length}
        onOpenStarterGuide={() => setIsStarterGuideOpen(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-5">
        {activeTab === 'boards' && (
          <BoardView
            user={user}
            boards={boards}
            posts={posts}
            replies={replies}
            onDataChange={reloadData}
            language={settings.language}
          />
        )}

        {activeTab === 'chat' && <PacketChatView />}

        {activeTab === 'doors' && (
          <DoorGamesView
            onPostCreated={reloadData}
            onNavigateToBoard={() => setActiveTab('boards')}
          />
        )}

        {activeTab === 'files' && <FileLibraryView />}

        {activeTab === 'tasks' && (
          <TaskView
            tasks={tasks}
            user={user}
            onDataChange={reloadData}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            boards={boards}
            posts={posts}
            replies={replies}
            tasks={tasks}
            user={user}
            onDataChange={reloadData}
          />
        )}

        {activeTab === 'sync' && (
          <SyncView
            syncStatus={syncStatus}
            conflicts={conflicts}
            queue={queue}
            onTriggerSync={handleTriggerSync}
            onToggleOffline={handleToggleOffline}
            onDataChange={reloadData}
          />
        )}

        {activeTab === 'api' && <ApiPlaygroundView />}

        {activeTab === 'sysop' && (
          <SysOpPanelView
            user={user}
            onDataChange={reloadData}
            onSendEmergencyBroadcast={(title, body) => {
              const newAlert: BbsNotification = {
                id: `alert-${Date.now()}`,
                title: `[NOODNET] ${title}`,
                body,
                timestamp: 'Zojuist',
                type: 'alert',
                read: false,
              };
              setNotifications(prev => [newAlert, ...prev]);
            }}
          />
        )}

        {activeTab === 'help' && <HelpView />}
      </main>

      {/* Sticky Bottom Interactive CLI Prompt */}
      <CommandLine
        onExecuteCommand={handleExecuteCommand}
        theme={settings.theme}
        language={settings.language}
        onOpenStarterGuide={() => setIsStarterGuideOpen(true)}
      />

      {/* Interactieve Startersgids Modal */}
      <StarterGuideModal
        isOpen={isStarterGuideOpen}
        onClose={() => setIsStarterGuideOpen(false)}
        onRunCommand={cmd => handleExecuteCommand(cmd)}
        theme={settings.theme}
        language={settings.language}
      />

      {/* Security, MFA & E2EE Modal */}
      <SecurityModal
        user={user}
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        onUserUpdated={u => setUser(u)}
      />

      {/* Systeemmeldingen & Push Alerts Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() =>
          setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        }
        onClearAll={() => setNotifications([])}
      />
    </div>
  );
}
