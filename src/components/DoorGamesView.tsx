/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { sound } from '../utils/sound';
import { ANSI, AnsiRenderer } from '../utils/ansi';
import { storage } from '../utils/storage';
import { Gamepad2, Award, Palette, Copy, Check, Send, RotateCcw, ArrowRight } from 'lucide-react';

interface DoorGamesViewProps {
  onPostCreated?: () => void;
  onNavigateToBoard?: () => void;
}

interface Question {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

const TRIVIA_QUESTIONS: Question[] = [
  {
    q: 'Welke radiofrequentieband wordt in Europa primair gebruikt voor licentievrije Meshtastic LoRa communicatie?',
    options: ['433.050 MHz', '869.525 MHz (LongFast)', '915.000 MHz', '2.400 GHz'],
    correct: 1,
    explanation: '869.525 MHz is de aanbevolen standaard in Europa met een maximaal zendvermogen van 500mW ERP.',
  },
  {
    q: 'Wat betekent het BBS-commando "SysOp"?',
    options: ['Synchronous Optical Port', 'System Operator', 'System Optimization Protocol', 'Serial Operation Port'],
    correct: 1,
    explanation: 'System Operator (SysOp) is de traditionele benaming voor de beheerder van een Bulletin Board System.',
  },
  {
    q: 'Welke symmetrische encryptiestandaard wordt gebruikt voor end-to-end beveiliging van gevoelige BBS-berichten?',
    options: ['DES-56', 'RC4-128', 'AES-256-GCM', 'MD5'],
    correct: 2,
    explanation: 'AES-256-GCM biedt zowel geheimhouding als cryptografische integriteitsverificatie (authenticatietag).',
  },
  {
    q: 'Wat is het belangrijkste voordeel van een offline-first IndexedDB database?',
    options: [
      'Data verdwijnt direct bij het sluiten van de browser',
      'Gegevens blijven lokaal bewaard en direct doorzoekbaar zonder actieve internetverbinding',
      'Vereist altijd een snelle glasvezelverbinding',
      'Werkt alleen op mainframe computers',
    ],
    correct: 1,
    explanation: 'IndexedDB bewaart gestructureerde documenten lokaal op het apparaat voor permanente offline beschikbaarheid.',
  },
  {
    q: 'Wat is de ASCII-waarde van het traditionele terminal "Bell" signaal?',
    options: ['0x07 (\\a)', '0x0D (\\r)', '0x0A (\\n)', '0x1B (ESC)'],
    correct: 0,
    explanation: 'ASCII 0x07 (BEL / \\a) activeerde van oudsher het belmechanisme of de interne luidspreker van de teletype terminal.',
  },
];

export const DoorGamesView: React.FC<DoorGamesViewProps> = ({ onPostCreated, onNavigateToBoard }) => {
  const [activeDoor, setActiveDoor] = useState<'trivia' | 'ansipaint'>('trivia');

  // Trivia state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [highScores, setHighScores] = useState<Array<{ name: string; score: number; date: string }>>([
    { name: 'SysOp-Willem', score: 500, date: 'Vandaag' },
    { name: 'Kees_Mesh', score: 400, date: 'Gisteren' },
    { name: 'Anouk_K', score: 300, date: '2 dagen geleden' },
  ]);

  // ANSI Paint state
  const [canvasText, setCanvasText] = useState(
    `╔════════════════════════════════════════╗\n║  RETRO BBS DOOR UTILITY ART STUDIO     ║\n║  [█] LOKALE NOODCOMMUNICATIE ACTIEF    ║\n╚════════════════════════════════════════╝`
  );
  const [copiedArt, setCopiedArt] = useState(false);
  const [artPosted, setArtPosted] = useState(false);

  // Trivia actions
  const handleSelectAnswer = (idx: number) => {
    if (isAnswerSubmitted) return;
    sound.keyClick();
    setSelectedAnswer(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);

    const isCorrect = selectedAnswer === TRIVIA_QUESTIONS[currentQIndex].correct;
    if (isCorrect) {
      sound.execute();
      setScore(prev => prev + 100);
    } else {
      sound.errorBeep();
    }
  };

  const handleNextQuestion = () => {
    sound.keyClick();
    if (currentQIndex + 1 < TRIVIA_QUESTIONS.length) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsGameOver(true);
      sound.bell();
      // Add to high scores
      setHighScores(prev => [
        { name: 'Jij (Node #1)', score: score + (selectedAnswer === TRIVIA_QUESTIONS[currentQIndex].correct ? 100 : 0), date: 'Zojuist' },
        ...prev,
      ].sort((a, b) => b.score - a.score).slice(0, 5));
    }
  };

  const handleRestartTrivia = () => {
    sound.keyClick();
    setCurrentQIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsGameOver(false);
  };

  // ANSI Paint actions
  const insertChar = (char: string) => {
    sound.keyClick();
    setCanvasText(prev => prev + char);
  };

  const handleCopyArt = () => {
    sound.keyClick();
    navigator.clipboard.writeText(canvasText);
    setCopiedArt(true);
    setTimeout(() => setCopiedArt(false), 2000);
  };

  const handlePostArtToBoard = () => {
    sound.execute();
    const newPost = {
      id: `p-art-${Date.now()}`,
      boardId: 'b-general',
      author: 'SysOp-Willem',
      callsign: 'PA3BBS',
      title: 'Nieuwe ANSI Kunstcreatie (uit Door Game)',
      content: `${ANSI.BRIGHT_CYAN}${canvasText}${ANSI.RESET}`,
      isEncrypted: false,
      tags: ['ansi', 'art', 'doorgame'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      repliesCount: 0,
      authorNode: 1,
    };
    storage.savePost(newPost);
    setArtPosted(true);
    if (onPostCreated) onPostCreated();
    setTimeout(() => setArtPosted(false), 3000);
  };

  const currentQ = TRIVIA_QUESTIONS[currentQIndex];

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="border border-inherit/40 p-3 bg-inherit/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold tracking-wider flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-amber-400" />
            <span>BBS DOOR UTILITIES & ENTERTAINMENT</span>
          </h2>
          <p className="opacity-70 mt-0.5 text-[11px]">
            Klassieke externe BBS Door utilities: Speel de Lokale Mesh & Radio Trivia of ontwerp ANSI kunst.
          </p>
        </div>

        {/* Door Selector Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.keyClick();
              setActiveDoor('trivia');
            }}
            className={`px-3 py-1.5 border transition-colors flex items-center gap-1.5 ${
              activeDoor === 'trivia'
                ? 'border-current bg-current/20 font-bold'
                : 'border-inherit/30 hover:border-inherit/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>[DOOR 1: MESH TRIVIA]</span>
          </button>

          <button
            onClick={() => {
              sound.keyClick();
              setActiveDoor('ansipaint');
            }}
            className={`px-3 py-1.5 border transition-colors flex items-center gap-1.5 ${
              activeDoor === 'ansipaint'
                ? 'border-current bg-current/20 font-bold'
                : 'border-inherit/30 hover:border-inherit/60'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>[DOOR 2: ANSI ART STUDIO]</span>
          </button>
        </div>
      </div>

      {/* DOOR 1: TRIVIA GAME */}
      {activeDoor === 'trivia' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 border border-inherit/40 p-4 bg-black/40 space-y-4">
            <div className="flex items-center justify-between border-b border-inherit/30 pb-2">
              <span className="font-bold text-sm tracking-wide text-amber-400">
                LOKALE NOODCOMMUNICATIE & BBS TRIVIA
              </span>
              <span className="opacity-80 tabular-nums">
                VRAAG {currentQIndex + 1} / {TRIVIA_QUESTIONS.length} · SCORE: <strong>{score}</strong>
              </span>
            </div>

            {!isGameOver ? (
              <div className="space-y-4">
                <div className="text-sm font-bold leading-snug">
                  {currentQIndex + 1}. {currentQ.q}
                </div>

                {/* Multiple choice options */}
                <div className="space-y-2">
                  {currentQ.options.map((opt, idx) => {
                    let btnStyle = 'border-inherit/30 bg-black/50 hover:bg-white/5';
                    if (isAnswerSubmitted) {
                      if (idx === currentQ.correct) {
                        btnStyle = 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold';
                      } else if (idx === selectedAnswer) {
                        btnStyle = 'border-red-500 bg-red-950/60 text-red-300';
                      } else {
                        btnStyle = 'border-inherit/20 opacity-40';
                      }
                    } else if (selectedAnswer === idx) {
                      btnStyle = 'border-current bg-current/20 font-bold';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectAnswer(idx)}
                        disabled={isAnswerSubmitted}
                        className={`w-full text-left p-2.5 border transition-all text-xs flex items-center justify-between ${btnStyle}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="opacity-60 text-[10px]">[{String.fromCharCode(65 + idx)}]</span>
                          <span>{opt}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Feedback explanation after submit */}
                {isAnswerSubmitted && (
                  <div className="p-3 border border-inherit/40 bg-black/60 space-y-1">
                    <div className="font-bold text-xs">
                      {selectedAnswer === currentQ.correct ? (
                        <span className="text-emerald-400">[CORRECT! +100 PUNTEN]</span>
                      ) : (
                        <span className="text-red-400">[HELAAS! ONJUIST]</span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-80 leading-relaxed">
                      {currentQ.explanation}
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {!isAnswerSubmitted ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={selectedAnswer === null}
                      className="px-4 py-2 bg-current text-black font-bold text-xs hover:opacity-90 disabled:opacity-40"
                    >
                      ANTWOORD VERZENDEN
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-4 py-2 bg-current text-black font-bold text-xs hover:opacity-90 flex items-center gap-1.5"
                    >
                      <span>{currentQIndex + 1 === TRIVIA_QUESTIONS.length ? 'EINDUITSLAG BEKIJKEN' : 'VOLGENDE VRAAG'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Game Over Screen */
              <div className="p-6 border border-inherit/40 bg-black/60 text-center space-y-4">
                <div className="text-2xl font-bold tracking-widest text-amber-400">
                  ★ SPEL VOLTOOID ★
                </div>
                <div className="text-sm">
                  Uw behaalde eindscore is: <strong className="text-xl tabular-nums">{score}</strong> punten!
                </div>
                <p className="text-xs opacity-75 max-w-md mx-auto">
                  Uitstekende prestatie. Uw score is direct geregistreerd in de lokale Hall of Fame van Node #1.
                </p>
                <button
                  onClick={handleRestartTrivia}
                  className="px-4 py-2 bg-current text-black font-bold text-xs hover:opacity-90 inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>OPNIEUW SPELEN</span>
                </button>
              </div>
            )}
          </div>

          {/* High Scores Leaderboard */}
          <div className="lg:col-span-4 border border-inherit/40 p-4 bg-black/40 space-y-3">
            <div className="font-bold border-b border-inherit/30 pb-1.5 text-xs flex items-center gap-2 text-amber-400">
              <Award className="w-4 h-4" />
              <span>BBS HALL OF FAME (TOP SCORES)</span>
            </div>

            <div className="space-y-2 text-xs">
              {highScores.map((h, i) => (
                <div
                  key={i}
                  className="p-2 border border-inherit/20 bg-black/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="opacity-50 text-[10px]">#{i + 1}</span>
                    <span className="font-bold truncate">{h.name}</span>
                  </div>
                  <div className="text-right tabular-nums">
                    <strong className="text-amber-400">{h.score}</strong>
                    <span className="text-[10px] opacity-50 ml-1">({h.date})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DOOR 2: ANSI ART STUDIO */}
      {activeDoor === 'ansipaint' && (
        <div className="border border-inherit/40 p-4 bg-black/40 space-y-4">
          <div className="flex items-center justify-between border-b border-inherit/30 pb-2">
            <span className="font-bold text-sm tracking-wide text-cyan-400">
              ANSI & ASCII ART CREATIVE STUDIO
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyArt}
                className="px-2.5 py-1 border border-inherit/40 hover:bg-white/10 text-xs flex items-center gap-1"
              >
                {copiedArt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedArt ? 'GEKOPIEERD' : 'KOPIEER ART'}</span>
              </button>

              <button
                onClick={handlePostArtToBoard}
                disabled={artPosted}
                className="px-3 py-1 bg-current text-black font-bold text-xs hover:opacity-90 flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>{artPosted ? 'GEPLAATST OP BORD!' : 'PLAATS DIRECT OP BORD'}</span>
              </button>
            </div>
          </div>

          {/* Palette insert bar */}
          <div className="flex items-center gap-1.5 flex-wrap p-2 border border-inherit/30 bg-black text-xs select-none">
            <span className="opacity-60 text-[10px] mr-1">SYMBOOL PALET:</span>
            {['█', '▓', '▒', '░', '═', '║', '╔', '╗', '╚', '╝', '╦', '╩', '╬', '▲', '▼', '◄', '►', '★', '◆', '●'].map(
              ch => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => insertChar(ch)}
                  className="px-2 py-0.5 border border-inherit/40 hover:bg-white/15 text-sm font-bold"
                >
                  {ch}
                </button>
              )
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Editor Textarea */}
            <div className="space-y-1">
              <label className="text-[11px] opacity-75">ASCII / ANSI BRONTEKST:</label>
              <textarea
                rows={9}
                value={canvasText}
                onChange={e => setCanvasText(e.target.value)}
                className="w-full bg-black border border-inherit/50 p-2.5 text-xs font-mono text-inherit outline-none focus:border-current leading-tight"
                spellCheck="false"
              />
            </div>

            {/* Live ANSI Preview */}
            <div className="space-y-1">
              <label className="text-[11px] opacity-75">LIVE TERMINAL PREVIEW:</label>
              <div className="h-[188px] bg-black border border-inherit/50 p-2.5 overflow-auto font-mono text-xs whitespace-pre leading-tight select-none">
                <AnsiRenderer text={canvasText} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
