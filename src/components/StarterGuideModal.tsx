/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { sound } from '../utils/sound';
import { TerminalTheme } from '../types';
import { SupportedLanguage, t } from '../utils/i18n';
import {
  Terminal,
  ShieldCheck,
  Radio,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  Compass,
} from 'lucide-react';

export interface StarterGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCommand: (command: string) => void;
  theme: TerminalTheme;
  language?: SupportedLanguage;
}

export const StarterGuideModal: React.FC<StarterGuideModalProps> = ({
  isOpen,
  onClose,
  onRunCommand,
  theme,
  language = 'en',
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  if (!isOpen) return null;

  const themeClasses: Record<TerminalTheme, string> = {
    green: 'border-emerald-600 bg-neutral-950 text-emerald-400',
    amber: 'border-amber-600 bg-neutral-950 text-amber-400',
    dos: 'border-blue-400 bg-blue-950 text-neutral-100',
    'modern-dark': 'border-neutral-700 bg-neutral-900 text-neutral-200',
    'modern-light': 'border-neutral-400 bg-neutral-50 text-neutral-900',
  };

  const handleNext = () => {
    sound.keyClick();
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      sound.execute();
      try {
        localStorage.setItem('bbs_tour_seen', 'true');
      } catch (e) {}
      onClose();
    }
  };

  const handlePrev = () => {
    sound.keyClick();
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleQuickRun = (cmd: string) => {
    sound.execute();
    try {
      localStorage.setItem('bbs_tour_seen', 'true');
    } catch (e) {}
    onClose();
    onRunCommand(cmd);
  };

  const getQuickCommands = () => {
    switch (language) {
      case 'nl':
        return [
          { cmd: 'boards', desc: 'Discussiekanalen bekijken' },
          { cmd: 'post', desc: 'Nieuw bericht opstellen' },
          { cmd: 'chat', desc: 'Packet radio chat openen' },
          { cmd: 'tasks', desc: 'Gemeenschapstaken overzicht' },
          { cmd: 'sync', desc: 'Offline outbox synchroniseren' },
          { cmd: 'theme green', desc: 'Groen CRT fosfor thema' },
          { cmd: 'theme amber', desc: 'Amber CRT fosfor thema' },
          { cmd: 'help', desc: 'Volledige handleiding openen' },
        ];
      case 'de':
        return [
          { cmd: 'boards', desc: 'Foren durchsuchen' },
          { cmd: 'post', desc: 'Neuen Beitrag erstellen' },
          { cmd: 'chat', desc: 'Funkchat öffnen' },
          { cmd: 'tasks', desc: 'Aufgabenübersicht' },
          { cmd: 'sync', desc: 'Offline-Daten synchronisieren' },
          { cmd: 'theme green', desc: 'Grünes Phosphor-Thema' },
          { cmd: 'theme amber', desc: 'Bernstein-Thema' },
          { cmd: 'help', desc: 'Handbuch aufrufen' },
        ];
      case 'fr':
        return [
          { cmd: 'boards', desc: 'Parcourir les forums' },
          { cmd: 'post', desc: 'Rédiger un message' },
          { cmd: 'chat', desc: 'Ouvrir le chat radio' },
          { cmd: 'tasks', desc: 'Gestionnaire de tâches' },
          { cmd: 'sync', desc: 'Synchroniser boîte d\'envoi' },
          { cmd: 'theme green', desc: 'Thème vert CRT' },
          { cmd: 'theme amber', desc: 'Thème ambre CRT' },
          { cmd: 'help', desc: 'Ouvrir l\'aide complète' },
        ];
      case 'es':
        return [
          { cmd: 'boards', desc: 'Ver foros y canales' },
          { cmd: 'post', desc: 'Redactar nuevo mensaje' },
          { cmd: 'chat', desc: 'Chat de radio por paquetes' },
          { cmd: 'tasks', desc: 'Tablero de tareas' },
          { cmd: 'sync', desc: 'Sincronizar bandeja' },
          { cmd: 'theme green', desc: 'Tema fósforo verde' },
          { cmd: 'theme amber', desc: 'Tema ámbar CRT' },
          { cmd: 'help', desc: 'Manual y documentación' },
        ];
      default:
        return [
          { cmd: 'boards', desc: 'Browse discussion boards' },
          { cmd: 'post', desc: 'Compose a new message' },
          { cmd: 'chat', desc: 'Open packet radio chat' },
          { cmd: 'tasks', desc: 'Community task manager' },
          { cmd: 'sync', desc: 'Synchronize offline outbox' },
          { cmd: 'theme green', desc: 'Green phosphor CRT' },
          { cmd: 'theme amber', desc: 'Amber phosphor CRT' },
          { cmd: 'help', desc: 'Open complete manual' },
        ];
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-5 font-mono text-xs select-none">
      <div
        className={`w-full max-w-2xl border-2 shadow-2xl p-5 space-y-4 max-h-[92vh] flex flex-col justify-between ${themeClasses[theme]}`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-inherit/40 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-current animate-spin-slow" />
            <span className="font-bold tracking-widest text-sm">
              {t('guideModalTitle', language)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="opacity-70 text-[11px] tabular-nums">
              {t('guideStepCount', language, currentStep, totalSteps)}
            </span>
            <button
              onClick={() => {
                sound.keyClick();
                onClose();
              }}
              className="p-1 hover:bg-white/10 border border-inherit/30"
              title={t('cliClose', language)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-2 space-y-3">
          {currentStep === 1 && (
            <div className="space-y-3 animate-fadeIn">
              <h3 className="text-sm font-bold flex items-center gap-2 text-current">
                <Terminal className="w-4 h-4" />
                <span>{t('guideStep1Title', language)}</span>
              </h3>
              <p className="opacity-90 leading-relaxed text-xs">
                {t('guideStep1Desc', language)}
              </p>
              <div className="border border-inherit/30 p-3 bg-inherit/5 space-y-1.5 text-[11px]">
                <div className="font-bold opacity-80 uppercase tracking-wide">
                  {language === 'nl' ? 'KERNPUNTEN VAN DIT SYSTEEM:' : 'KEY PILLARS OF THIS SYSTEM:'}
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-current font-bold">»</span>
                  <span>{t('guideStep1Bullet1', language)}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-current font-bold">»</span>
                  <span>{t('guideStep1Bullet2', language)}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-current font-bold">»</span>
                  <span>{t('guideStep1Bullet3', language)}</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3 animate-fadeIn">
              <h3 className="text-sm font-bold flex items-center gap-2 text-current">
                <Terminal className="w-4 h-4" />
                <span>{t('guideStep2Title', language)}</span>
              </h3>
              <p className="opacity-90 leading-relaxed text-xs">
                {t('guideStep2Desc', language)}
              </p>

              <div className="border border-inherit/30 p-3 bg-black/40 space-y-2 text-[11px]">
                <div className="font-bold opacity-80 border-b border-inherit/20 pb-1">
                  {language === 'nl'
                    ? 'MEEST GEBRUIKTE OPDRACHTEN (KLIK OM DIRECT UIT TE VOEREN):'
                    : 'FREQUENT COMMANDS (CLICK TO EXECUTE INSTANTLY):'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {getQuickCommands().map(item => (
                    <button
                      key={item.cmd}
                      onClick={() => handleQuickRun(item.cmd)}
                      className="p-1.5 border border-inherit/30 hover:bg-white/10 text-left flex items-center justify-between gap-1 transition-colors group"
                    >
                      <span className="font-bold text-current group-hover:underline">
                        BBS&gt; {item.cmd}
                      </span>
                      <span className="opacity-60 text-[10px]">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] opacity-70">
                <strong>{language === 'nl' ? 'Handige tip: ' : 'Helpful tip: '}</strong>
                {t('guideStep2Hint', language)}
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-3 animate-fadeIn">
              <h3 className="text-sm font-bold flex items-center gap-2 text-current">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{t('guideStep3Title', language)}</span>
              </h3>
              <p className="opacity-90 leading-relaxed text-xs">
                {t('guideStep3Desc', language)}
              </p>

              <div className="border border-inherit/30 p-3 bg-inherit/5 space-y-2 text-[11px]">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-current">1.</span>
                  <div>{t('guideStep3Item1', language)}</div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-current">2.</span>
                  <div>{t('guideStep3Item2', language)}</div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-current">3.</span>
                  <div>{t('guideStep3Item3', language)}</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-3 animate-fadeIn">
              <h3 className="text-sm font-bold flex items-center gap-2 text-current">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>{t('guideStep4Title', language)}</span>
              </h3>
              <p className="opacity-90 leading-relaxed text-xs">
                {t('guideStep4Desc', language)}
              </p>

              <div className="border border-inherit/30 p-3 bg-inherit/5 space-y-2 text-[11px]">
                <div>{t('guideStep4LoRa', language)}</div>
                <div>{t('guideStep4Bell', language)}</div>
                <div>
                  {language === 'nl'
                    ? 'Noodfrequenties Gids: Directe toegang tot PMR446 Kanaal 8 (88.5 Hz CTCSS) en het 2-meter noodnet.'
                    : 'Emergency Frequencies: Instant access to PMR446 Ch 8 (88.5 Hz CTCSS) and VHF emergency nets.'}
                </div>
              </div>

              <div className="p-2 border border-emerald-500/60 bg-emerald-950/20 text-emerald-400 text-[11px] font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{t('guideStep4Ready', language)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex items-center justify-between border-t border-inherit/40 pt-3 flex-wrap gap-2">
          <div>
            {currentStep > 1 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 border border-inherit/40 hover:bg-white/10 text-xs flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{t('guidePrev', language)}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.keyClick();
                onClose();
              }}
              className="px-3 py-1.5 border border-inherit/30 hover:bg-white/10 text-xs opacity-75"
            >
              {t('guideSkip', language)}
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                className="px-4 py-1.5 bg-current text-black font-bold text-xs hover:opacity-90 flex items-center gap-1"
              >
                <span>{t('guideNext', language)}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => handleQuickRun('boards')}
                className="px-4 py-1.5 bg-current text-black font-bold text-xs hover:opacity-90 flex items-center gap-1"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{t('guideStart', language)}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
