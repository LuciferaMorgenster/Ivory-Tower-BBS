/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { sound } from '../utils/sound';
import { Bell, Check, Trash2, ShieldAlert, Wifi, Calendar, MessageSquare, Volume2, VolumeX } from 'lucide-react';

export interface BbsNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  type: 'alert' | 'mesh' | 'task' | 'post';
  read: boolean;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: BbsNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
}) => {
  const [permissionState, setPermissionState] = useState<NotificationPermission>(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'default';
  });

  if (!isOpen) return null;

  const requestBrowserPushPermission = async () => {
    sound.execute();
    if (typeof Notification !== 'undefined') {
      const res = await Notification.requestPermission();
      setPermissionState(res);
      if (res === 'granted') {
        new Notification('Ivory Tower BBS', {
          body: 'Pushnotificaties ingeschakeld voor offline noodupdates.',
          icon: '/icon.svg',
        });
      }
    }
  };

  const getIcon = (type: BbsNotification['type']) => {
    switch (type) {
      case 'alert':
        return <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />;
      case 'mesh':
        return <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'task':
        return <Calendar className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'post':
        return <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-end p-3 sm:p-5 font-mono text-xs">
      <div className="border-2 border-inherit bg-neutral-950 text-inherit w-full max-w-md max-h-[85vh] flex flex-col p-4 space-y-3 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-inherit/40 pb-2">
          <div className="flex items-center gap-2 font-bold text-sm tracking-wide">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>SYSTEEMMELDINGEN & ALERTS ({notifications.filter(n => !n.read).length})</span>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-0.5 border border-inherit/40 hover:bg-white/10 text-xs font-bold"
          >
            [X SLUITEN]
          </button>
        </div>

        {/* Browser Push Notification Permission Banner */}
        {permissionState !== 'granted' && (
          <div className="p-2.5 border border-amber-600/60 bg-amber-950/30 space-y-1.5">
            <div className="font-bold text-[11px] text-amber-400">
              BROWSER PUSHNOTIFICATIES INSCHAKELEN
            </div>
            <p className="text-[10px] opacity-80 leading-relaxed">
              Ontvang meldingen wanneer de app geminimaliseerd is of op de achtergrond draait.
            </p>
            <button
              onClick={requestBrowserPushPermission}
              className="px-3 py-1 bg-amber-500 text-black font-bold text-[11px] hover:bg-amber-400"
            >
              TOESTEMMING VRAGEN
            </button>
          </div>
        )}

        {/* Controls Bar */}
        <div className="flex items-center justify-between text-[11px] border-b border-inherit/20 pb-1.5">
          <button
            onClick={() => {
              sound.keyClick();
              onMarkAllAsRead();
            }}
            className="opacity-75 hover:opacity-100 flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            <span>Markeer alles als gelezen</span>
          </button>

          <button
            onClick={() => {
              sound.keyClick();
              onClearAll();
            }}
            className="opacity-75 hover:opacity-100 flex items-center gap-1 text-red-400"
          >
            <Trash2 className="w-3 h-3" />
            <span>Meldingen wissen</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {notifications.length === 0 ? (
            <div className="p-8 border border-dashed border-inherit/30 text-center opacity-60 text-xs">
              Geen recente meldingen.
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-2.5 border transition-colors space-y-1 ${
                  n.read
                    ? 'border-inherit/20 bg-black/20 opacity-60'
                    : 'border-inherit/50 bg-black/50 font-semibold'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getIcon(n.type)}
                    <span className="text-xs truncate">{n.title}</span>
                  </div>
                  <span className="text-[10px] opacity-50 tabular-nums">
                    {n.timestamp}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 font-normal leading-relaxed pl-6">
                  {n.body}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
