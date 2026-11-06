/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TaskItem, UserAccount } from '../types';
import { storage } from '../utils/storage';
import { sound } from '../utils/sound';
import { exportTasksToCsv, exportTasksToIcs, printRetroPdfReport } from '../utils/exporter';
import {
  CheckSquare,
  Square,
  Plus,
  Download,
  Printer,
  Calendar,
  AlertTriangle,
  Clock,
  User,
} from 'lucide-react';

interface TaskViewProps {
  tasks: TaskItem[];
  user: UserAccount;
  onDataChange: () => void;
}

export const TaskView: React.FC<TaskViewProps> = ({ tasks, user, onDataChange }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState(user.username);
  const [priority, setPriority] = useState<TaskItem['priority']>('normal');
  const [category, setCategory] = useState('Onderhoud');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10)
  );

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const toggleTask = (task: TaskItem) => {
    sound.keyClick();
    const updated: TaskItem = { ...task, completed: !task.completed };
    storage.saveTask(updated);
    storage.addSyncQueueItem({
      id: `sync-t-${Date.now()}`,
      action: 'update',
      entityType: 'task',
      entityId: task.id,
      payload: updated,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });
    onDataChange();
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: TaskItem = {
      id: `t-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      assignedTo: assignedTo.trim() || user.username,
      priority,
      completed: false,
      dueDate,
      createdAt: new Date().toISOString(),
      category,
    };

    storage.saveTask(newTask);
    storage.addSyncQueueItem({
      id: `sync-t-${Date.now()}`,
      action: 'create',
      entityType: 'task',
      entityId: newTask.id,
      payload: newTask,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });

    sound.execute();
    setTitle('');
    setDescription('');
    setIsAddOpen(false);
    onDataChange();
  };

  const handlePrintPdf = () => {
    sound.execute();
    const rowsHtml = tasks
      .map(
        t => `<tr>
          <td>${t.completed ? '[X]' : '[ ]'}</td>
          <td><strong>${t.title}</strong><br><small>${t.description}</small></td>
          <td>${t.assignedTo}</td>
          <td>${t.priority.toUpperCase()}</td>
          <td>${t.dueDate}</td>
        </tr>`
      )
      .join('');

    const contentHtml = `
      <h3>Gemeenschapstaken & Nooddraaiboek</h3>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Taak & Beschrijving</th>
            <th>Toegewezen aan</th>
            <th>Prioriteit</th>
            <th>Vervaldatum</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;
    printRetroPdfReport('BBS Takenlijst Rapport', contentHtml);
  };

  const priorityColor = (p: TaskItem['priority']) => {
    switch (p) {
      case 'urgent':
        return 'text-red-400 border-red-700 bg-red-950/40';
      case 'high':
        return 'text-amber-400 border-amber-700 bg-amber-950/40';
      case 'normal':
        return 'text-emerald-400 border-emerald-700 bg-emerald-950/40';
      case 'low':
        return 'text-blue-400 border-blue-700 bg-blue-950/40';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-inherit/40 p-3 bg-inherit/5">
        <div>
          <h2 className="text-sm font-bold tracking-wider flex items-center gap-2">
            <span>[DOOR UTILITY] GEDEELDE GEMEENSCHAPSTAKEN & NOODDRAAIBOEK</span>
          </h2>
          <p className="text-xs opacity-70 mt-0.5">
            Gedeelde actiepunten voor lokaal onderhoud, nooddiensten en hardware.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              sound.execute();
              setIsAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-current text-black font-bold text-xs hover:opacity-90"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NIEUWE TAAK</span>
          </button>

          <button
            onClick={() => {
              sound.keyClick();
              exportTasksToCsv(tasks);
            }}
            title="Download takenlijst als CSV bestand"
            className="flex items-center gap-1 px-2.5 py-1.5 border border-inherit/40 hover:bg-white/10 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => {
              sound.execute();
              exportTasksToIcs(tasks);
            }}
            title="Exporteer taken naar standaard iCalendar (.ics) voor Google/Apple/Outlook Agenda"
            className="flex items-center gap-1 px-2.5 py-1.5 border border-inherit/40 hover:bg-white/10 text-xs font-semibold text-emerald-400"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>AGENDA (.ICS)</span>
          </button>

          <button
            onClick={handlePrintPdf}
            title="Rapport openen en afdrukken / PDF opslaan"
            className="flex items-center gap-1 px-2.5 py-1.5 border border-inherit/40 hover:bg-white/10 text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-inherit/30 pb-2 text-xs">
        <div className="flex items-center gap-2">
          {(['all', 'active', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                sound.keyClick();
                setFilter(tab);
              }}
              className={`px-2.5 py-1 border transition-colors capitalize ${
                filter === tab
                  ? 'border-current bg-current/20 font-bold'
                  : 'border-inherit/30 hover:border-inherit/60'
              }`}
            >
              {tab === 'all' ? 'Alle Taken' : tab === 'active' ? 'Te Doen' : 'Voltooid'}
            </button>
          ))}
        </div>

        <span className="opacity-60 tabular-nums">
          {filteredTasks.length} taken getoond
        </span>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="p-8 border border-dashed border-inherit/30 text-center text-xs opacity-60">
            Geen taken in deze categorie.
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              onClick={() => toggleTask(task)}
              className={`border p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
                task.completed
                  ? 'border-inherit/20 bg-black/10 opacity-60'
                  : 'border-inherit/40 bg-black/30 hover:bg-white/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="mt-0.5 text-current hover:opacity-80 shrink-0"
                >
                  {task.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                <div>
                  <div className={`font-bold text-xs ${task.completed ? 'line-through' : ''}`}>
                    {task.title}
                  </div>
                  {task.description && (
                    <p className="text-[11px] opacity-75 mt-0.5">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] opacity-65 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{task.assignedTo}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Vervalt: {task.dueDate}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{task.category}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <span
                  className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${priorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4">
          <div className="border-2 border-inherit bg-neutral-950 text-inherit w-full max-w-lg p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-inherit/40 pb-2">
              <h3 className="font-bold text-sm tracking-wide">
                [+] NIEUWE GEMEENSCHAPSTAAK TOEVOEGEN
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="px-2 py-0.5 border border-inherit/40 hover:bg-white/10 text-xs font-bold"
              >
                [X]
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 opacity-75">TITEL VAN DE TAAK:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Bijv. Antennekabel vervangen of aggregaat tanken"
                  className="w-full bg-black border border-inherit/50 p-2 text-xs font-mono text-inherit outline-none focus:border-current"
                />
              </div>

              <div>
                <label className="block mb-1 opacity-75">BESCHRIJVING / INSTRUCTIES:</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Details, gereedschap en locatie..."
                  className="w-full bg-black border border-inherit/50 p-2 text-xs font-mono text-inherit outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 opacity-75">TOEGEWEZEN AAN:</label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    className="w-full bg-black border border-inherit/50 p-2 text-xs font-mono text-inherit outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 opacity-75">PRIORITEIT:</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full bg-black border border-inherit/50 p-2 text-xs font-mono text-inherit outline-none"
                  >
                    <option value="low">Laag</option>
                    <option value="normal">Normaal</option>
                    <option value="high">Hoog</option>
                    <option value="urgent">Urgent / Noodgeval</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 opacity-75">CATEGORIE:</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-black border border-inherit/50 p-2 text-xs font-mono text-inherit outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 opacity-75">VERVALDATUM:</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-black border border-inherit/50 p-2 text-xs font-mono text-inherit outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-inherit/40">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-1.5 border border-inherit/40 hover:bg-white/10"
                >
                  ANNULEREN
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-current text-black font-bold hover:opacity-90"
                >
                  TAAK OPSLAAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
