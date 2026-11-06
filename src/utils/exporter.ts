/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Post, TaskItem, Board } from '../types';
import { stripAnsi } from './ansi';

/**
 * Escapes fields for CSV output.
 */
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports BBS posts to CSV.
 */
export function exportPostsToCsv(posts: Post[], boards: Board[]): void {
  const boardMap = new Map(boards.map(b => [b.id, b.name]));
  const headers = ['ID', 'Board', 'Auteur', 'Roepnaam', 'Titel', 'Inhoud', 'E2EE', 'Tags', 'Aanmaakdatum', 'Reacties'];

  const rows = posts.map(p => [
    escapeCsv(p.id),
    escapeCsv(boardMap.get(p.boardId) || p.boardId),
    escapeCsv(p.author),
    escapeCsv(p.callsign),
    escapeCsv(p.title),
    escapeCsv(stripAnsi(p.content)),
    escapeCsv(p.isEncrypted ? 'Ja' : 'Nee'),
    escapeCsv(p.tags.join('; ')),
    escapeCsv(p.createdAt),
    escapeCsv(p.repliesCount || 0),
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadBlob(csvContent, 'bbs_berichten_export.csv', 'text/csv;charset=utf-8;');
}

/**
 * Exports Tasks to CSV.
 */
export function exportTasksToCsv(tasks: TaskItem[]): void {
  const headers = ['ID', 'Titel', 'Beschrijving', 'Toegewezen aan', 'Prioriteit', 'Status', 'Vervaldatum', 'Categorie'];

  const rows = tasks.map(t => [
    escapeCsv(t.id),
    escapeCsv(t.title),
    escapeCsv(t.description),
    escapeCsv(t.assignedTo),
    escapeCsv(t.priority),
    escapeCsv(t.completed ? 'Voltooid' : 'Open'),
    escapeCsv(t.dueDate),
    escapeCsv(t.category),
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadBlob(csvContent, 'bbs_taken_export.csv', 'text/csv;charset=utf-8;');
}

/**
 * Exports Tasks to standard iCalendar (.ics) format for synchronization with external calendars
 * (Google Calendar, Apple Calendar, Outlook, Nextcloud).
 */
export function exportTasksToIcs(tasks: TaskItem[]): void {
  const events = tasks.map(t => {
    // Format date as YYYYMMDD
    const rawDate = t.dueDate ? t.dueDate.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cleanDesc = t.description ? t.description.replace(/\n/g, '\\n') : '';
    const cleanTitle = t.title.replace(/\n/g, ' ');

    return [
      'BEGIN:VEVENT',
      `UID:${t.id}@bbs.localnode`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `DTSTART;VALUE=DATE:${rawDate}`,
      `DTEND;VALUE=DATE:${rawDate}`,
      `SUMMARY:[BBS Taak] ${cleanTitle}`,
      `DESCRIPTION:${cleanDesc} (Toegewezen aan: ${t.assignedTo})`,
      `STATUS:${t.completed ? 'COMPLETED' : 'CONFIRMED'}`,
      `CATEGORIES:${t.category}`,
      `PRIORITY:${t.priority === 'urgent' ? '1' : t.priority === 'high' ? '3' : t.priority === 'normal' ? '5' : '9'}`,
      'END:VEVENT',
    ].join('\r\n');
  });

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ivory Tower BBS//Agenda Sync//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Ivory Tower BBS Emergency Schedule & Tasks',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  downloadBlob(icsContent, 'bbs_agenda_taken.ics', 'text/calendar;charset=utf-8;');
}

/**
 * Generates and triggers browser print-to-PDF with a retro styled report.
 */
export function printRetroPdfReport(title: string, contentHtml: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up geblokkeerd. Sta pop-ups toe om het rapport af te drukken.');
    return;
  }

  const printDocument = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @media print {
      @page { margin: 1.5cm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      color: #111;
      background: #fff;
      padding: 20px;
      line-height: 1.4;
      font-size: 13px;
    }
    .header {
      border-bottom: 2px dashed #333;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .meta {
      font-size: 11px;
      color: #666;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 6px 8px;
      text-align: left;
    }
    th {
      background: #f0f0f0;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #ddd;
      padding-top: 8px;
      font-size: 10px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">IVORY TOWER BBS // SYSTEM REPORT</div>
    <div class="meta">Generated: ${new Date().toLocaleString()} · Node #1 · SysOp: Bastard Operator From Hell (BOFH)</div>
  </div>
  ${contentHtml}
  <div class="footer">
    BBS End-of-Transmission. Gegevens gegenereerd via lokaal gecachete IndexedDB.
  </div>
  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(printDocument);
  printWindow.document.close();
}

/**
 * Download helper for files.
 */
function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
