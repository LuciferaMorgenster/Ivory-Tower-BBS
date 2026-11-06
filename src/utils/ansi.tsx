/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// Standard 16-color ANSI palette mapped to CSS classes / hex
export const ANSI_COLORS: Record<number, string> = {
  // Standard foregrounds
  30: 'text-neutral-900 dark:text-neutral-900', // Black
  31: 'text-red-500 font-bold',                  // Red
  32: 'text-emerald-500',                       // Green
  33: 'text-amber-400 font-bold',               // Yellow/Amber
  34: 'text-blue-400',                          // Blue
  35: 'text-fuchsia-400',                       // Magenta
  36: 'text-cyan-400',                          // Cyan
  37: 'text-neutral-200',                       // White

  // High intensity / bright foregrounds
  90: 'text-neutral-500',                       // Bright Black (Gray)
  91: 'text-red-400 font-semibold',             // Bright Red
  92: 'text-emerald-400 font-semibold',         // Bright Green
  93: 'text-amber-300 font-semibold',           // Bright Yellow
  94: 'text-blue-300 font-semibold',            // Bright Blue
  95: 'text-fuchsia-300 font-semibold',         // Bright Magenta
  96: 'text-cyan-300 font-semibold',            // Bright Cyan
  97: 'text-white font-bold',                   // Bright White

  // Backgrounds
  40: 'bg-black',
  41: 'bg-red-950',
  42: 'bg-emerald-950',
  43: 'bg-amber-950',
  44: 'bg-blue-950',
  45: 'bg-purple-950',
  46: 'bg-cyan-950',
  47: 'bg-neutral-800',
};

export interface AnsiSpan {
  text: string;
  fg?: number;
  bg?: number;
  bold?: boolean;
  underline?: boolean;
  dim?: boolean;
}

/**
 * Strips ANSI escape sequences from text for indexing, length, or plain export.
 */
export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Parses a string containing ANSI escape sequences into structured styled spans.
 */
export function parseAnsi(text: string): AnsiSpan[] {
  const spans: AnsiSpan[] = [];
  // Regex to match ANSI escape codes: \x1b[...m
  // eslint-disable-next-line no-control-regex
  const ansiRegex = /\x1b\[([0-9;]*)m/g;

  let currentFg: number | undefined;
  let currentBg: number | undefined;
  let currentBold = false;
  let currentUnderline = false;
  let currentDim = false;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ansiRegex.exec(text)) !== null) {
    const rawText = text.slice(lastIndex, match.index);
    if (rawText.length > 0) {
      spans.push({
        text: rawText,
        fg: currentFg,
        bg: currentBg,
        bold: currentBold,
        underline: currentUnderline,
        dim: currentDim,
      });
    }

    const codeStr = match[1];
    if (!codeStr || codeStr === '0' || codeStr === '') {
      // Reset all styles
      currentFg = undefined;
      currentBg = undefined;
      currentBold = false;
      currentUnderline = false;
      currentDim = false;
    } else {
      const codes = codeStr.split(';').map(c => parseInt(c, 10)).filter(n => !isNaN(n));
      for (const code of codes) {
        if (code === 0) {
          currentFg = undefined;
          currentBg = undefined;
          currentBold = false;
          currentUnderline = false;
          currentDim = false;
        } else if (code === 1) {
          currentBold = true;
        } else if (code === 2) {
          currentDim = true;
        } else if (code === 4) {
          currentUnderline = true;
        } else if (code === 22) {
          currentBold = false;
          currentDim = false;
        } else if (code === 24) {
          currentUnderline = false;
        } else if ((code >= 30 && code <= 37) || (code >= 90 && code <= 97)) {
          currentFg = code;
        } else if (code === 39) {
          currentFg = undefined;
        } else if ((code >= 40 && code <= 47) || (code >= 100 && code <= 107)) {
          currentBg = code;
        } else if (code === 49) {
          currentBg = undefined;
        }
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Push remainder
  if (lastIndex < text.length) {
    spans.push({
      text: text.slice(lastIndex),
      fg: currentFg,
      bg: currentBg,
      bold: currentBold,
      underline: currentUnderline,
      dim: currentDim,
    });
  }

  return spans;
}

/**
 * Component to render parsed ANSI text into styled React spans.
 */
export const AnsiRenderer: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const spans = React.useMemo(() => parseAnsi(text), [text]);

  const renderContentWithLinks = (rawText: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = rawText.split(urlRegex);
    if (parts.length === 1) return rawText;
    return parts.map((part, i) => {
      if (part.match(/^https?:\/\//)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80 break-all cursor-pointer font-bold inline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <span className={`whitespace-pre-wrap font-mono ${className}`}>
      {spans.map((span, idx) => {
        const classNames: string[] = [];
        if (span.fg && ANSI_COLORS[span.fg]) {
          classNames.push(ANSI_COLORS[span.fg]);
        }
        if (span.bg && ANSI_COLORS[span.bg]) {
          classNames.push(ANSI_COLORS[span.bg]);
        }
        if (span.bold) classNames.push('font-bold');
        if (span.underline) classNames.push('underline');
        if (span.dim) classNames.push('opacity-60');

        return (
          <span key={idx} className={classNames.join(' ')}>
            {renderContentWithLinks(span.text)}
          </span>
        );
      })}
    </span>
  );
};

// ANSI Format helper codes for building retro messages
export const ANSI = {
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m',
  UNDERLINE: '\x1b[4m',
  // Colors
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  BRIGHT_BLACK: '\x1b[90m',
  BRIGHT_RED: '\x1b[91m',
  BRIGHT_GREEN: '\x1b[92m',
  BRIGHT_YELLOW: '\x1b[93m',
  BRIGHT_BLUE: '\x1b[94m',
  BRIGHT_MAGENTA: '\x1b[95m',
  BRIGHT_CYAN: '\x1b[96m',
  BRIGHT_WHITE: '\x1b[97m',
};
