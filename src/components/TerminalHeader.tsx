/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TerminalTheme, UserAccount, UserSettings } from '../types';
import { SyncEngineStatus } from '../utils/sync';
import { sound } from '../utils/sound';
import {
  ShieldCheck,
  ShieldAlert,
  Volume2,
  VolumeX,
  Tv,
  Wifi,
  WifiOff,
  RefreshCw,
  KeyRound,
  Fingerprint,
  Bell,
  Battery,
  BatteryCharging,
  Download,
  Type,
  Globe,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { t, SupportedLanguage, SUPPORTED_LANGUAGES } from '../utils/i18n';

interface TerminalHeaderProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  user: UserAccount;
  syncStatus: SyncEngineStatus;
  onTriggerSync: () => void;
  onOpenSecurity: () => void;
  onToggleSimulatedOffline: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  onOpenStarterGuide?: () => void;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  settings,
  onUpdateSettings,
  user,
  syncStatus,
  onTriggerSync,
  onOpenSecurity,
  onToggleSimulatedOffline,
  activeTab,
  onSelectTab,
  onOpenNotifications,
  unreadNotificationsCount,
  onOpenStarterGuide,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = React.useState(false);
  const themeClasses: Record<TerminalTheme, string> = {
    green: 'border-emerald-800 bg-neutral-950 text-emerald-400',
    amber: 'border-amber-800 bg-neutral-950 text-amber-400',
    dos: 'border-blue-900 bg-blue-950 text-neutral-100',
    'modern-dark': 'border-neutral-800 bg-neutral-900 text-neutral-200',
    'modern-light': 'border-neutral-300 bg-neutral-100 text-neutral-800',
  };

  const navItems = [
    { id: 'boards', label: t('navBoards', settings.language) },
    { id: 'chat', label: t('navChat', settings.language) },
    { id: 'doors', label: t('navDoors', settings.language) },
    { id: 'files', label: t('navFiles', settings.language) },
    { id: 'tasks', label: t('navTasks', settings.language) },
    { id: 'dashboard', label: t('navDashboard', settings.language) },
    { id: 'sync', label: syncStatus.conflictCount > 0 ? `${t('navSync', settings.language)} (!${syncStatus.conflictCount})` : t('navSync', settings.language) },
    { id: 'api', label: t('navApi', settings.language) },
    { id: 'sysop', label: t('navSysop', settings.language) },
    { id: 'help', label: t('navHelp', settings.language) },
  ];

  return (
    <header className={`w-full border-b select-none transition-colors duration-150 ${themeClasses[settings.theme]}`}>
      {/* Top Banner Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs border-b border-inherit/40">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-widest text-sm flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 inline-block bg-current rounded-none animate-pulse" />
            {t('bbsTitle', settings.language)}
          </span>
          <span className="hidden sm:inline opacity-70">·</span>
          <span className="hidden sm:inline font-mono">{user.callsign}</span>
          <span className="hidden sm:inline opacity-70">·</span>
          <span className="hidden md:inline tabular-nums">{user.baudRate} BAUD</span>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Online / Offline status & toggle */}
          <button
            onClick={() => {
              sound.keyClick();
              onToggleSimulatedOffline();
            }}
            title={syncStatus.isOnline ? 'Online (click to test offline)' : 'Offline / Airgap mode active'}
            className={`flex items-center gap-1.5 px-2 py-0.5 border text-[11px] font-mono transition-colors ${
              syncStatus.isOnline
                ? 'border-emerald-600/60 text-emerald-400 hover:bg-emerald-950/40'
                : 'border-amber-600/60 text-amber-400 bg-amber-950/20 hover:bg-amber-900/30'
            }`}
          >
            {syncStatus.isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{syncStatus.isOnline ? t('online', settings.language) : t('offlineMode', settings.language)}</span>
            {syncStatus.pendingCount > 0 && (
              <span className="ml-1 px-1 bg-amber-500/20 text-amber-300 font-bold">
                {syncStatus.pendingCount}
              </span>
            )}
          </button>

          {/* Sync Trigger button */}
          <button
            onClick={() => {
              sound.keyClick();
              onTriggerSync();
            }}
            disabled={syncStatus.isSyncing}
            title="Sync with local mesh peers"
            className="flex items-center gap-1 px-2 py-0.5 border border-inherit/40 hover:bg-white/5 transition-colors text-[11px]"
          >
            <RefreshCw className={`w-3 h-3 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{syncStatus.isSyncing ? t('syncing', settings.language) : t('sync', settings.language)}</span>
          </button>

          {/* Sound toggle */}
          <button
            onClick={() => {
              const next = !settings.soundEnabled;
              sound.setEnabled(next);
              if (next) sound.bell();
              onUpdateSettings({ soundEnabled: next });
            }}
            title={settings.soundEnabled ? 'Geluidseffecten ingeschakeld' : 'Geluid gedempt'}
            className="p-1 border border-inherit/40 hover:bg-white/5"
          >
            {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 opacity-50" />}
          </button>

          {/* CRT Scanline toggle */}
          <button
            onClick={() => {
              sound.keyClick();
              onUpdateSettings({ scanlines: !settings.scanlines });
            }}
            title={settings.scanlines ? 'CRT Scanlijnen actief' : 'Scanlijnen uitgeschakeld'}
            className={`p-1 border border-inherit/40 hover:bg-white/5 ${settings.scanlines ? 'opacity-100' : 'opacity-40'}`}
          >
            <Tv className="w-3.5 h-3.5" />
          </button>

          {/* Security & 2FA modal */}
          <button
            onClick={() => {
              sound.keyClick();
              onOpenSecurity();
            }}
            title="Beveiliging, E2EE sleutels en 2FA instellingen"
            className="flex items-center gap-1 px-2 py-0.5 border border-inherit/60 hover:bg-white/10 font-bold text-[11px]"
          >
            {user.mfaEnabled ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden sm:inline">2FA / E2EE</span>
          </button>

          {/* Notifications Drawer button */}
          <button
            onClick={() => {
              sound.keyClick();
              onOpenNotifications();
            }}
            title="Systeemmeldingen & Nood-alerts"
            className="p-1 border border-inherit/40 hover:bg-white/5 relative"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Battery Saver Mode Toggle */}
          <button
            onClick={() => {
              sound.keyClick();
              onUpdateSettings({ batterySaver: !settings.batterySaver });
            }}
            title={settings.batterySaver ? 'Batterijbesparing actief (animaties uit)' : 'Standaard prestatiemodus'}
            className={`p-1 border border-inherit/40 hover:bg-white/5 ${settings.batterySaver ? 'text-emerald-400 bg-emerald-950/40' : 'opacity-60'}`}
          >
            {settings.batterySaver ? <BatteryCharging className="w-3.5 h-3.5" /> : <Battery className="w-3.5 h-3.5" />}
          </button>

          {/* A11y Font Size Scaler */}
          <button
            onClick={() => {
              sound.keyClick();
              const nextSize = settings.fontSize === 'normal' ? 'large' : settings.fontSize === 'large' ? 'huge' : 'normal';
              onUpdateSettings({ fontSize: nextSize });
            }}
            title={`Tekstgrootte wijzigen (Huidig: ${settings.fontSize})`}
            className="px-1.5 py-0.5 border border-inherit/40 hover:bg-white/5 text-[10px] font-bold"
          >
            <span className="flex items-center gap-0.5">
              <Type className="w-3 h-3" />
              <span>{settings.fontSize === 'huge' ? 'A++' : settings.fontSize === 'large' ? 'A+' : 'A'}</span>
            </span>
          </button>

          {/* In-App PWA Install Button */}
          {!isInstalled && isInstallable && (
            <button
              onClick={() => {
                sound.execute();
                install();
              }}
              title={settings.language === 'nl' ? 'Installeer Ivory Tower BBS als standalone app' : 'Install Ivory Tower BBS as standalone app'}
              className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-black font-bold text-[11px] hover:bg-emerald-400"
            >
              <Download className="w-3 h-3" />
              <span>{t('installPwa', settings.language)}</span>
            </button>
          )}

          {!isInstalled && isIOS && (
            <button
              onClick={() => setShowIOSModal(true)}
              title="Instructies voor toevoegen aan beginscherm op iPhone/iPad"
              className="flex items-center gap-1 px-2 py-0.5 border border-inherit/60 text-[11px] hover:bg-white/10"
            >
              <span>+ PWA iOS</span>
            </button>
          )}

          {/* Startersgids / Help Tour button */}
          {onOpenStarterGuide && (
            <button
              onClick={() => {
                sound.execute();
                onOpenStarterGuide();
              }}
              title="Open the interactive starter guide and command help"
              className="flex items-center gap-1 px-2 py-0.5 border border-inherit/60 hover:bg-white/10 text-[11px] font-bold"
            >
              <span>{t('guideBtn', settings.language)}</span>
            </button>
          )}

          {/* Multilingual Language Switcher */}
          <div className="flex items-center border border-inherit/50 text-[10px]">
            <span className="px-1.5 py-0.5 border-r border-inherit/40 opacity-70 flex items-center gap-1 font-bold">
              <Globe className="w-3 h-3" />
              <span>LANG:</span>
            </span>
            <select
              value={settings.language}
              onChange={e => {
                sound.keyClick();
                onUpdateSettings({ language: e.target.value as SupportedLanguage });
              }}
              className="bg-black/80 text-inherit font-mono px-1 py-0.5 outline-none cursor-pointer text-[10px]"
              title="Select interface language / Wählen Sie die Sprache"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-neutral-900 text-white">
                  {lang.flag} - {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Theme selector */}
          <div className="flex items-center border border-inherit/50 text-[10px]">
            {(['amber', 'green', 'dos', 'modern-dark', 'modern-light'] as TerminalTheme[]).map(t => (
              <button
                key={t}
                onClick={() => {
                  sound.keyClick();
                  onUpdateSettings({ theme: t });
                }}
                className={`px-1.5 py-0.5 capitalize transition-colors ${
                  settings.theme === t
                    ? 'bg-current text-black font-bold'
                    : 'opacity-70 hover:opacity-100 hover:bg-white/5'
                }`}
                title={`Switch theme to ${t}`}
              >
                {t === 'modern-dark' ? 'M-Dark' : t === 'modern-light' ? 'M-Light' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Navigation Row - Top Bar Contract compliant */}
      <div className="flex items-center justify-between gap-4 px-4 py-2.5 overflow-x-auto">
        <nav className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.execute();
                  onSelectTab(item.id);
                }}
                className={`px-2.5 py-1 transition-all whitespace-nowrap shrink-0 border ${
                  isActive
                    ? 'border-current bg-current/15 font-bold shadow-sm'
                    : 'border-transparent opacity-75 hover:opacity-100 hover:border-inherit/30'
                }`}
              >
                [{item.label}]
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 text-[11px] opacity-75 whitespace-nowrap shrink-0">
          <span className="hidden lg:inline">{t('userLabel', settings.language)}: <strong className="opacity-100">{user.username}</strong></span>
          <span className="hidden lg:inline">({user.role})</span>
          {user.biometricRegistered && (
            <span title="Biometrie geregistreerd">
              <Fingerprint className="w-3.5 h-3.5 text-emerald-400 inline" />
            </span>
          )}
        </div>
      </div>

      {/* iOS PWA Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="border-2 border-inherit bg-neutral-950 text-inherit w-full max-w-sm p-5 space-y-3 shadow-2xl font-mono text-xs">
            <h3 className="text-sm font-bold border-b border-inherit/40 pb-2">
              INSTALLEREN OP IPHONE / IPAD
            </h3>
            <p className="opacity-80 leading-relaxed text-[11px]">
              1. Tik onderaan in Safari op de <strong>Deel-knop</strong> (vierkant met pijl omhoog).<br />
              2. Scroll naar beneden en tik op <strong>Zet op beginscherm</strong>.<br />
              3. Bevestig met <strong>Voeg toe</strong>.
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full mt-2 py-1.5 border border-inherit hover:bg-white/10 font-bold"
            >
              BEGREPEN [SLUITEN]
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
