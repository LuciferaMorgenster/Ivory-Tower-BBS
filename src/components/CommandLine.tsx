/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { sound } from '../utils/sound';
import { TerminalTheme } from '../types';
import { SupportedLanguage, t } from '../utils/i18n';
import { Terminal, Send, HelpCircle, Compass, ChevronRight } from 'lucide-react';

interface CommandLineProps {
  onExecuteCommand: (command: string) => { success: boolean; message: string };
  theme: TerminalTheme;
  language?: SupportedLanguage;
  onOpenStarterGuide?: () => void;
}

interface CommandInfo {
  cmd: string;
  desc: string;
  category: string;
}

export const CommandLine: React.FC<CommandLineProps> = ({
  onExecuteCommand,
  theme,
  language = 'en',
  onOpenStarterGuide,
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const themeBorderClasses: Record<TerminalTheme, string> = {
    green: 'border-emerald-800 bg-neutral-950/95 text-emerald-400',
    amber: 'border-amber-800 bg-neutral-950/95 text-amber-400',
    dos: 'border-blue-800 bg-blue-950/95 text-neutral-100',
    'modern-dark': 'border-neutral-800 bg-neutral-900/95 text-neutral-200',
    'modern-light': 'border-neutral-300 bg-white/95 text-neutral-800 shadow-sm',
  };

  const getCommandDirectory = (): CommandInfo[] => {
    const isNl = language === 'nl';
    return [
      { cmd: 'help', desc: isNl ? 'Toon overzicht van alle opdrachten en handleiding' : 'Show command directory and manual', category: isNl ? 'Algemeen' : 'General' },
      { cmd: 'tour', desc: isNl ? 'Interactieve startersgids en rondleiding openen' : 'Open interactive onboarding guide', category: isNl ? 'Algemeen' : 'General' },
      { cmd: 'boards', desc: isNl ? 'Naar discussiekanalen navigeren' : 'Navigate to discussion channels', category: isNl ? 'Borden' : 'Boards' },
      { cmd: 'post', desc: isNl ? 'Nieuw forumbericht opstellen' : 'Compose new forum message', category: isNl ? 'Borden' : 'Boards' },
      { cmd: 'chat', desc: isNl ? 'Real-time packet radio chat openen' : 'Open real-time packet radio chat', category: 'Radio' },
      { cmd: 'wx', desc: isNl ? 'APRS weerstation telemetrie en zonneflux bekijken' : 'APRS telemetry and solar space weather', category: 'Radio' },
      { cmd: 'freq', desc: isNl ? 'Noodfrequenties en Bell 202 AFSK audio gids' : 'Emergency channels & Bell 202 AFSK audio', category: 'Radio' },
      { cmd: 'doors', desc: isNl ? 'BBS utilities, retro trivia en ANSI Art Studio' : 'BBS utilities, retro trivia and ANSI studio', category: 'Games' },
      { cmd: 'files', desc: isNl ? 'Bestandenbibliotheek en XMODEM download' : 'File library and XMODEM transfers', category: isNl ? 'Bestanden' : 'Files' },
      { cmd: 'tasks', desc: isNl ? 'Gemeenschapstaken overzicht en agenda sync' : 'Community tasks & schedule sync', category: isNl ? 'Taken' : 'Tasks' },
      { cmd: 'calendar', desc: isNl ? 'Agenda-bestand (.ics) downloaden' : 'Download calendar schedule (.ics)', category: isNl ? 'Taken' : 'Tasks' },
      { cmd: 'dashboard', desc: isNl ? 'Data-analyse, grafieken en back-up download' : 'Data analytics & JSON/CSV backups', category: isNl ? 'Systeem' : 'System' },
      { cmd: 'sync', desc: isNl ? 'Offline outbox synchroniseren met netwerk' : 'Sync offline outbox with peers', category: isNl ? 'Systeem' : 'System' },
      { cmd: 'theme green', desc: isNl ? 'Groen CRT fosfor schermthema' : 'Green CRT phosphor theme', category: isNl ? 'Thema' : 'Theme' },
      { cmd: 'theme amber', desc: isNl ? 'Amber CRT fosfor schermthema' : 'Amber CRT phosphor theme', category: isNl ? 'Thema' : 'Theme' },
      { cmd: 'theme dos', desc: isNl ? 'Klassiek DOS 16-kleuren thema' : 'Classic DOS 16-color theme', category: isNl ? 'Thema' : 'Theme' },
      { cmd: 'theme dark', desc: isNl ? 'Modern donker monospace thema' : 'Modern dark monospace theme', category: isNl ? 'Thema' : 'Theme' },
      { cmd: 'theme light', desc: isNl ? 'Modern licht monospace thema' : 'Modern light monospace theme', category: isNl ? 'Thema' : 'Theme' },
      { cmd: 'security', desc: isNl ? 'Beheer van 2FA, biometrie en E2EE sleutels' : 'Manage 2FA, passkeys & E2EE master seed', category: isNl ? 'Beveiliging' : 'Security' },
      { cmd: 'e2ee', desc: isNl ? 'End-to-end encryptie sleutelbeheer' : 'End-to-end encryption key management', category: isNl ? 'Beveiliging' : 'Security' },
      { cmd: 'sysop', desc: isNl ? 'Systeembeheerdersconsole (voor SysOps)' : 'SysOp administration console & logs', category: isNl ? 'Systeem' : 'System' },
      { cmd: 'api', desc: isNl ? 'REST API client sandbox & documentatie' : 'REST API client sandbox & documentation', category: isNl ? 'Systeem' : 'System' },
      { cmd: 'export', desc: isNl ? 'Data exporteren naar CSV, PDF of JSON' : 'Export data to CSV, PDF or JSON', category: isNl ? 'Systeem' : 'System' },
      { cmd: 'sound', desc: isNl ? 'Geluidseffecten in- of uitschakelen' : 'Toggle synthesizer audio effects', category: isNl ? 'Instelling' : 'Settings' },
      { cmd: 'scanlines', desc: isNl ? 'CRT scanlijnen in- of uitschakelen' : 'Toggle CRT phosphor scanlines', category: isNl ? 'Instelling' : 'Settings' },
      { cmd: 'dial', desc: isNl ? 'Speel vintage modem inbelsequentie af' : 'Play acoustic coupler dialing sequence', category: 'Retro' },
      { cmd: 'clear', desc: isNl ? 'Schermmeldingen wissen' : 'Clear terminal messages', category: 'Terminal' },
    ];
  };

  const commandDirectory = getCommandDirectory();
  const cleanInput = input.trim().toLowerCase();

  // Filter matching suggestions
  const matchingSuggestions = cleanInput
    ? commandDirectory.filter(
        c =>
          c.cmd.toLowerCase().startsWith(cleanInput) ||
          c.cmd.toLowerCase().includes(cleanInput) ||
          c.desc.toLowerCase().includes(cleanInput)
      ).slice(0, 4)
    : [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    sound.keyClick();

    if (e.key === 'Enter') {
      e.preventDefault();
      runCurrentCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIndex = historyIndex + 1 < history.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIndex);
        setInput(history[history.length - 1 - nextIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(history[history.length - 1 - nextIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Auto-complete to first matching command
      if (matchingSuggestions.length > 0) {
        setInput(matchingSuggestions[0].cmd);
      }
    } else if (e.key === 'Escape') {
      setShowCheatsheet(false);
    }
  };

  const runCurrentCommand = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    if (trimmed === 'tour' || trimmed === 'guide' || trimmed === 'start' || trimmed === 'gids') {
      if (onOpenStarterGuide) {
        onOpenStarterGuide();
        sound.execute();
        setFeedback({
          text: language === 'nl' ? 'Startersgids geopend.' : 'Starter guide opened.',
          isError: false,
        });
        setInput('');
        return;
      }
    }

    setHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);
    setInput('');
    setShowCheatsheet(false);

    const res = onExecuteCommand(trimmed);
    if (res.success) {
      sound.execute();
      setFeedback({ text: res.message, isError: false });
    } else {
      sound.errorBeep();
      setFeedback({ text: res.message, isError: true });
    }

    // Auto-dismiss feedback after 4.5 seconds
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  return (
    <div className={`border-t font-mono transition-colors relative ${themeBorderClasses[theme]}`}>
      {/* Live Auto-suggestion Popup when user is typing */}
      {matchingSuggestions.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 sm:left-12 sm:right-auto sm:w-96 mb-1 border-2 border-inherit bg-black/95 p-2 shadow-2xl z-30 font-mono text-xs space-y-1">
          <div className="text-[10px] opacity-60 border-b border-inherit/30 pb-1 flex items-center justify-between">
            <span>{t('cliSuggestionsFor', language, input)}</span>
            <span className="opacity-40">[ESC]</span>
          </div>
          {matchingSuggestions.map(s => (
            <button
              key={s.cmd}
              type="button"
              onClick={() => runCurrentCommand(s.cmd)}
              className="w-full text-left p-1.5 hover:bg-white/10 flex items-center justify-between gap-2 border border-transparent hover:border-inherit/30 transition-colors group"
            >
              <div className="flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 text-current group-hover:translate-x-0.5 transition-transform" />
                <span className="font-bold text-current">{s.cmd}</span>
              </div>
              <span className="opacity-60 text-[10px] truncate">{s.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Cheatsheet Quick Modal if toggled */}
      {showCheatsheet && (
        <div className="absolute bottom-full left-4 right-4 mb-2 max-w-xl border-2 border-inherit bg-black/95 p-4 shadow-2xl z-40 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-inherit/30 pb-1.5">
            <span className="font-bold flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>{t('cliCheatsheetTitle', language)}</span>
            </span>
            <button
              onClick={() => setShowCheatsheet(false)}
              className="p-0.5 hover:bg-white/10 border border-inherit/30 text-[10px]"
            >
              {t('cliClose', language)}
            </button>
          </div>

          <p className="text-[11px] opacity-80">
            {t('cliCheatsheetHelp', language)}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-1">
            {commandDirectory.slice(0, 14).map(c => (
              <button
                key={c.cmd}
                onClick={() => runCurrentCommand(c.cmd)}
                className="p-1 border border-inherit/25 hover:bg-white/10 text-left flex items-center justify-between text-[11px]"
              >
                <span className="font-bold text-current">{c.cmd}</span>
                <span className="opacity-60 text-[10px] truncate ml-1">{c.category}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feedback banner if recent command was executed */}
      {feedback && (
        <div
          className={`px-4 py-1.5 text-xs border-b flex items-center justify-between ${
            feedback.isError
              ? 'bg-red-950/80 text-red-300 border-red-800'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-[10px] opacity-70 hover:opacity-100 ml-2"
          >
            [X]
          </button>
        </div>
      )}

      {/* Main command prompt row */}
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="font-bold flex items-center gap-1 shrink-0 select-none text-xs sm:text-sm">
          <Terminal className="w-4 h-4 opacity-75" />
          <span>{t('cliPrompt', language)}</span>
        </span>

        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('cliPlaceholder', language)}
            className="w-full bg-transparent border-none outline-none font-mono text-xs sm:text-sm placeholder:opacity-40"
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        {/* Quick Cheatsheet Toggle */}
        <button
          type="button"
          onClick={() => {
            sound.keyClick();
            setShowCheatsheet(prev => !prev);
          }}
          className="p-1.5 border border-inherit/40 hover:bg-white/10 shrink-0 text-xs flex items-center gap-1"
          title={language === 'nl' ? "Bekijk lijst van commando's" : 'View command directory'}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[10px]">
            {language === 'nl' ? 'HULP' : 'HELP'}
          </span>
        </button>

        {/* Startersgids Button */}
        {onOpenStarterGuide && (
          <button
            type="button"
            onClick={() => {
              sound.execute();
              onOpenStarterGuide();
            }}
            className="px-2 py-1 bg-current text-black font-bold shrink-0 text-xs flex items-center gap-1 hover:opacity-90"
            title={language === 'nl' ? 'Open de interactieve startersgids' : 'Open interactive starter guide'}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px]">
              {language === 'nl' ? 'GIDS' : 'GUIDE'}
            </span>
          </button>
        )}

        <button
          onClick={() => runCurrentCommand(input)}
          className="p-1.5 border border-inherit/40 hover:bg-white/10 shrink-0 text-xs"
          title={t('cliExecute', language)}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick BBS Function Keys Bar */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-t border-inherit/30 text-[11px] overflow-x-auto select-none">
        <span className="opacity-50 mr-1 text-[10px]">{t('cliHotkeys', language)}</span>
        {[
          { label: language === 'nl' ? 'GIDS' : 'GUIDE', cmd: 'tour' },
          { label: 'HELP', cmd: 'help' },
          { label: language === 'nl' ? 'BORDEN' : 'BOARDS', cmd: 'boards' },
          { label: 'POST', cmd: 'post' },
          { label: 'CHAT', cmd: 'chat' },
          { label: language === 'nl' ? 'WEER' : 'WEATHER', cmd: 'wx' },
          { label: 'DOORS', cmd: 'doors' },
          { label: language === 'nl' ? 'BESTANDEN' : 'FILES', cmd: 'files' },
          { label: language === 'nl' ? 'TAKEN' : 'TASKS', cmd: 'tasks' },
          { label: 'DASHBOARD', cmd: 'dashboard' },
          { label: 'SYNC', cmd: 'sync' },
          { label: 'E2EE', cmd: 'e2ee' },
          { label: 'SYSOP', cmd: 'sysop' },
          { label: language === 'nl' ? 'THEMA' : 'THEME', cmd: 'theme green' },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => {
              sound.keyClick();
              runCurrentCommand(item.cmd);
            }}
            className="px-2 py-0.5 border border-inherit/30 hover:bg-white/10 whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity text-[10px]"
          >
            [{item.label}]
          </button>
        ))}
      </div>
    </div>
  );
};
