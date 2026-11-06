/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { storage } from '../utils/storage';
import { sound } from '../utils/sound';
import { Code, Play, Copy, Check, Terminal, Globe, Send } from 'lucide-react';

export const ApiPlaygroundView: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET /api/bbs/boards');
  const [responseOutput, setResponseOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const endpoints = [
    {
      id: 'GET /api/bbs/boards',
      method: 'GET',
      path: '/api/bbs/boards',
      description: 'Lijst van alle actieve BBS discussieborden ophalen met metadata.',
      handler: () => storage.getBoards(),
    },
    {
      id: 'GET /api/bbs/posts',
      method: 'GET',
      path: '/api/bbs/posts',
      description: 'Alle discussieberichten ophalen (optioneel filterbaar op boardId of tag).',
      handler: () => storage.getPosts(),
    },
    {
      id: 'GET /api/bbs/tasks',
      method: 'GET',
      path: '/api/bbs/tasks',
      description: 'Gemeenschapstaken en noodactiepunten opvragen.',
      handler: () => storage.getTasks(),
    },
    {
      id: 'GET /api/bbs/stats',
      method: 'GET',
      path: '/api/bbs/stats',
      description: 'Real-time statistieken, opslagvolume en node-gezondheid.',
      handler: () => ({
        totalPosts: storage.getPosts().length,
        totalBoards: storage.getBoards().length,
        totalReplies: storage.getReplies().length,
        totalTasks: storage.getTasks().length,
        nodeStatus: 'online',
        baudRate: 19200,
        serverTime: new Date().toISOString(),
      }),
    },
    {
      id: 'POST /api/bbs/posts',
      method: 'POST',
      path: '/api/bbs/posts',
      description: 'Nieuw bericht plaatsen via externe client of API token.',
      handler: () => ({
        success: true,
        message: 'Bericht succesvol geaccepteerd en toegevoegd aan de lokale outbox.',
        postId: `p-api-${Date.now()}`,
        status: 'queued_for_sync',
      }),
    },
  ];

  const currentEndpoint = endpoints.find(e => e.id === selectedEndpoint) || endpoints[0];

  const handleTestEndpoint = () => {
    sound.execute();
    setIsLoading(true);
    setTimeout(() => {
      const data = currentEndpoint.handler();
      setResponseOutput(JSON.stringify(data, null, 2));
      setIsLoading(false);
    }, 250);
  };

  const curlSnippet = `curl -X ${currentEndpoint.method} "https://bbs.localnode${currentEndpoint.path}" \\
  -H "Authorization: Bearer bbs_token_node1" \\
  -H "Content-Type: application/json"`;

  const jsSnippet = `const res = await fetch("https://bbs.localnode${currentEndpoint.path}", {
  method: "${currentEndpoint.method}",
  headers: {
    "Authorization": "Bearer bbs_token_node1",
    "Content-Type": "application/json"
  }
});
const data = await res.json();
console.log(data);`;

  const copyToClipboard = (text: string) => {
    sound.keyClick();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="border border-inherit/40 p-3 bg-inherit/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>EXTERNE CLIENT API & INTEGRATIE PLAYGROUND</span>
          </h2>
          <p className="opacity-70 mt-0.5 text-[11px]">
            REST / JSON endpoints voor naadloze integratie met LoRa gateways, externe CLI scripts en mobile apps.
          </p>
        </div>

        <button
          onClick={handleTestEndpoint}
          disabled={isLoading}
          className="px-4 py-2 bg-current text-black font-bold text-xs hover:opacity-90 flex items-center gap-1.5 shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isLoading ? 'UITVOEREN...' : 'ENDPOINT TESTEN'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Endpoint Selector Navigation */}
        <div className="lg:col-span-4 border border-inherit/40 p-3 bg-black/30 space-y-2">
          <div className="font-bold border-b border-inherit/30 pb-1.5 opacity-80 text-[11px]">
            BESCHIKBARE REST ENDPOINTS:
          </div>

          <div className="space-y-1">
            {endpoints.map(ep => {
              const isSelected = selectedEndpoint === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => {
                    sound.keyClick();
                    setSelectedEndpoint(ep.id);
                    setResponseOutput('');
                  }}
                  className={`w-full text-left p-2 border transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'border-current bg-current/15 font-bold'
                      : 'border-inherit/20 hover:border-inherit/50 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold ${
                        ep.method === 'GET'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="truncate text-xs">{ep.path}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-inherit/20 pt-2 text-[11px] opacity-70">
            {currentEndpoint.description}
          </div>
        </div>

        {/* Code Snippets & Response Sandbox */}
        <div className="lg:col-span-8 space-y-4">
          {/* Code Snippet Box */}
          <div className="border border-inherit/40 p-3 bg-black/40 space-y-2">
            <div className="flex items-center justify-between border-b border-inherit/30 pb-1">
              <span className="font-bold text-[11px] opacity-80 flex items-center gap-1">
                <Code className="w-3.5 h-3.5" />
                <span>INTEGRATIE CODEVOORBEELDEN (cURL / JAVASCRIPT)</span>
              </span>
              <button
                onClick={() => copyToClipboard(curlSnippet)}
                className="flex items-center gap-1 opacity-70 hover:opacity-100 text-[10px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'GEKOPIEERD' : 'KOPIEER cURL'}</span>
              </button>
            </div>

            <pre className="p-2.5 bg-black text-current border border-inherit/30 text-[11px] overflow-x-auto whitespace-pre leading-relaxed">
              {curlSnippet}
            </pre>
          </div>

          {/* Response Box */}
          <div className="border border-inherit/40 p-3 bg-black/40 space-y-2">
            <div className="flex items-center justify-between border-b border-inherit/30 pb-1">
              <span className="font-bold text-[11px] opacity-80 flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>LIVE JSON RESPONS (UIT LOKALE DATABASE)</span>
              </span>
              {responseOutput && (
                <button
                  onClick={() => copyToClipboard(responseOutput)}
                  className="opacity-70 hover:opacity-100 text-[10px]"
                >
                  [KOPIEER JSON]
                </button>
              )}
            </div>

            {responseOutput ? (
              <pre className="p-3 bg-black text-current border border-inherit/30 text-[11px] overflow-x-auto max-h-72 leading-relaxed whitespace-pre">
                {responseOutput}
              </pre>
            ) : (
              <div className="p-8 border border-dashed border-inherit/30 text-center opacity-60 text-xs">
                Klik op &apos;ENDPOINT TESTEN&apos; om live gegevens op te halen uit de BBS IndexedDB.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
