/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Board, Post, Reply, UserAccount } from '../types';
import { storage } from '../utils/storage';
import { sound } from '../utils/sound';
import { AnsiRenderer, ANSI, stripAnsi } from '../utils/ansi';
import { encryptMessage, decryptMessage } from '../utils/crypto';
import { SupportedLanguage, t } from '../utils/i18n';
import {
  Lock,
  Unlock,
  MessageSquare,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  Send,
  Eye,
  CheckCircle,
  Tag,
  ShieldAlert,
  Share2,
  Copy,
  QrCode,
  Check,
} from 'lucide-react';

interface BoardViewProps {
  user: UserAccount;
  boards: Board[];
  posts: Post[];
  replies: Reply[];
  onDataChange: () => void;
  openComposerOnMount?: boolean;
  language?: SupportedLanguage;
}

export const BoardView: React.FC<BoardViewProps> = ({
  user,
  boards,
  posts,
  replies,
  onDataChange,
  openComposerOnMount = false,
  language = 'en',
}) => {
  const [selectedBoardId, setSelectedBoardId] = useState<string>('all');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEncryptedOnly, setFilterEncryptedOnly] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(openComposerOnMount);

  // Decrypted contents cache for E2EE posts: [postId]: decryptedText
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});
  const [decryptingIds, setDecryptingIds] = useState<Record<string, boolean>>({});

  // Composer form state
  const [composerBoardId, setComposerBoardId] = useState(boards[0]?.id || 'b-general');
  const [composerTitle, setComposerTitle] = useState('');
  const [composerContent, setComposerContent] = useState('');
  const [composerTags, setComposerTags] = useState('');
  const [composerIsEncrypted, setComposerIsEncrypted] = useState(false);
  const [composerPreviewMode, setComposerPreviewMode] = useState(false);

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedShareText, setCopiedShareText] = useState(false);

  // Reply form state
  const [replyContent, setReplyContent] = useState('');
  const [replyIsEncrypted, setReplyIsEncrypted] = useState(false);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (selectedBoardId !== 'all' && post.boardId !== selectedBoardId) {
        return false;
      }
      if (filterEncryptedOnly && !post.isEncrypted) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const plainContent = stripAnsi(post.content).toLowerCase();
        const matchesTitle = post.title.toLowerCase().includes(query);
        const matchesAuthor = post.author.toLowerCase().includes(query) || (post.callsign && post.callsign.toLowerCase().includes(query));
        const matchesTag = post.tags.some(t => t.toLowerCase().includes(query));
        return matchesTitle || matchesAuthor || plainContent.includes(query) || matchesTag;
      }
      return true;
    });
  }, [posts, selectedBoardId, filterEncryptedOnly, searchQuery]);

  // Current active post being read
  const activePost = useMemo(() => {
    return posts.find(p => p.id === selectedPostId);
  }, [posts, selectedPostId]);

  // Replies for current post
  const activeReplies = useMemo(() => {
    if (!selectedPostId) return [];
    return replies.filter(r => r.postId === selectedPostId);
  }, [replies, selectedPostId]);

  // Decrypt handler
  const handleDecryptPost = async (post: Post) => {
    const mnemonic = storage.getCryptoMnemonic();
    if (!mnemonic) {
      alert('Geen E2EE sleutel gevonden. Genereer of voer uw herstelwachtwoordzin in via het 2FA/E2EE menu.');
      return;
    }
    setDecryptingIds(prev => ({ ...prev, [post.id]: true }));
    sound.execute();

    try {
      const payload = post.encryptedPayload || post.content;
      const plain = await decryptMessage(payload, mnemonic);
      setDecryptedCache(prev => ({ ...prev, [post.id]: plain }));
    } catch {
      alert('Decryptie mislukt. Ongeldige sleutel.');
    } finally {
      setDecryptingIds(prev => ({ ...prev, [post.id]: false }));
    }
  };

  // Helper to insert ANSI codes into composer content
  const insertAnsiCode = (code: string) => {
    sound.keyClick();
    setComposerContent(prev => prev + code);
  };

  // Submit new post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerTitle.trim() || !composerContent.trim()) {
      sound.errorBeep();
      return;
    }

    let finalContent = composerContent;
    let encryptedPayload: string | undefined = undefined;

    if (composerIsEncrypted) {
      const mnemonic = storage.getCryptoMnemonic();
      if (!mnemonic) {
        alert('Activeer eerst E2EE via het 2FA/E2EE menu om versleutelde berichten te kunnen plaatsen.');
        return;
      }
      try {
        encryptedPayload = await encryptMessage(composerContent, mnemonic);
        finalContent = '[E2EE VERSLEUTELD BERICHT // SLEUTEL VEREIST]';
      } catch {
        alert('Versleuteling mislukt.');
        return;
      }
    }

    const tagsArray = composerTags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const newPost: Post = {
      id: `p-${Date.now()}`,
      boardId: composerBoardId,
      author: user.username,
      callsign: user.callsign,
      title: composerTitle.trim(),
      content: finalContent,
      isEncrypted: composerIsEncrypted,
      encryptedPayload: encryptedPayload,
      tags: tagsArray.length > 0 ? tagsArray : ['algemeen'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      repliesCount: 0,
      authorNode: user.nodeNumber,
    };

    storage.savePost(newPost);
    storage.addSyncQueueItem({
      id: `sync-${Date.now()}`,
      action: 'create',
      entityType: 'post',
      entityId: newPost.id,
      payload: newPost,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });

    sound.execute();
    setComposerTitle('');
    setComposerContent('');
    setComposerTags('');
    setComposerIsEncrypted(false);
    setIsComposerOpen(false);
    onDataChange();
  };

  // Submit reply
  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !activePost) return;

    let finalContent = replyContent;
    let encryptedPayload: string | undefined = undefined;

    if (replyIsEncrypted || activePost.isEncrypted) {
      const mnemonic = storage.getCryptoMnemonic();
      if (!mnemonic) {
        alert('Stel een E2EE sleutelzin in om versleuteld te reageren.');
        return;
      }
      try {
        encryptedPayload = await encryptMessage(replyContent, mnemonic);
        finalContent = '[E2EE VERSLEUTELDE REACTIE]';
      } catch {
        alert('Versleuteling mislukt.');
        return;
      }
    }

    const newReply: Reply = {
      id: `r-${Date.now()}`,
      postId: activePost.id,
      author: user.username,
      callsign: user.callsign,
      content: finalContent,
      isEncrypted: replyIsEncrypted || activePost.isEncrypted,
      encryptedPayload,
      createdAt: new Date().toISOString(),
      version: 1,
    };

    storage.saveReply(newReply);
    storage.addSyncQueueItem({
      id: `sync-r-${Date.now()}`,
      action: 'create',
      entityType: 'reply',
      entityId: newReply.id,
      payload: newReply,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });

    sound.execute();
    setReplyContent('');
    onDataChange();
  };

  return (
    <div className="space-y-4">
      {/* Retro ANSI ASCII Art Banner */}
      <div className="border border-inherit/40 p-3 bg-black/40 overflow-x-auto text-[11px] leading-tight font-mono select-none">
        <pre className="text-current opacity-90">
{`  ██████╗  ██████╗ ███████╗   ███╗   ██╗ ██████╗ ██████╗ ███████╗    ██╗  ██╗
  ██╔══██╗ ██╔══██╗██╔════╝   ████╗  ██║██╔═══██╗██╔══██╗██╔════╝    ██║  ██║
  ██████╔╝ ██████╔╝███████╗   ██╔██╗ ██║██║   ██║██║  ██║█████╗      ███████║
  ██╔══██╗ ██╔══██╗╚════██║   ██║╚██╗██║██║   ██║██║  ██║██╔══╝      ╚════██║
  ██████╔╝ ██████╔╝███████║██╗██║ ╚████║╚██████╔╝██████╔╝███████╗██╗      ██║
  ╚═════╝  ╚═════╝ ╚══════╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝      ╚═╝`}
        </pre>
        <div className="mt-1 text-center text-xs opacity-75">
          LOCAL BULLETIN BOARD SYSTEM · VERSIE 4.2-NL · VOLLEDIG OFFLINE-COMPATIBEL
        </div>
      </div>

      {/* Main View: Board List or Thread Viewer */}
      {!selectedPostId ? (
        <div className="space-y-4">
          {/* Top Actions: Board Selector & Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-inherit/40 p-3 bg-inherit/5">
            {/* Board Selector Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <button
                onClick={() => {
                  sound.keyClick();
                  setSelectedBoardId('all');
                }}
                className={`px-2.5 py-1 border transition-colors ${
                  selectedBoardId === 'all'
                    ? 'border-current bg-current/20 font-bold'
                    : 'border-inherit/30 hover:border-inherit/60'
                }`}
              >
                {language === 'nl' ? '[ALLE BORDEN]' : '[ALL BOARDS]'}
              </button>
              {boards.map(b => (
                <button
                  key={b.id}
                  onClick={() => {
                    sound.keyClick();
                    setSelectedBoardId(b.id);
                  }}
                  className={`px-2.5 py-1 border transition-colors flex items-center gap-1 ${
                    selectedBoardId === b.id
                      ? 'border-current bg-current/20 font-bold'
                      : 'border-inherit/30 hover:border-inherit/60'
                  }`}
                >
                  {b.isEncrypted && <Lock className="w-3 h-3 text-amber-400" />}
                  <span>[{b.code}] {b.name}</span>
                  <span className="opacity-60 text-[10px]">({b.postCount})</span>
                </button>
              ))}
            </div>

            {/* New Post Button */}
            <button
              onClick={() => {
                sound.execute();
                setIsComposerOpen(true);
              }}
              className="flex items-center justify-center gap-1 px-3 py-1.5 bg-current text-black font-bold text-xs hover:opacity-90 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('newPostBtn', language)}</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 border border-inherit/30 bg-black/20 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 opacity-60 shrink-0" />
              <input
                type="text"
                placeholder={t('searchPlaceholder', language)}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none font-mono text-xs placeholder:opacity-40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="opacity-60 hover:opacity-100 text-[10px]"
                >
                  {language === 'nl' ? '[WIS]' : '[CLEAR]'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filterEncryptedOnly}
                  onChange={e => {
                    sound.keyClick();
                    setFilterEncryptedOnly(e.target.checked);
                  }}
                  className="accent-current"
                />
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>{language === 'nl' ? 'Alleen E2EE Versleuteld' : 'Encrypted Only (E2EE)'}</span>
                </span>
              </label>

              <span className="opacity-60">|</span>
              <span className="tabular-nums opacity-75">
                {filteredPosts.length} {language === 'nl' ? 'berichten' : 'posts'}
              </span>
            </div>
          </div>

          {/* Posts List in Monospace Table format */}
          <div className="border border-inherit/40 overflow-hidden">
            <div className="bg-inherit/10 px-3 py-1.5 text-xs font-bold border-b border-inherit/40 grid grid-cols-12 gap-2 select-none">
              <div className="col-span-6 sm:col-span-7">
                {language === 'nl' ? 'ONDERWERP / DISCUSSIE' : 'TOPIC / THREAD'}
              </div>
              <div className="col-span-3 sm:col-span-3">
                {language === 'nl' ? 'AUTEUR / ROEPNAAM' : 'AUTHOR / CALLSIGN'}
              </div>
              <div className="col-span-3 sm:col-span-2 text-right">
                {language === 'nl' ? 'REACTIES · TIJD' : 'REPLIES · TIME'}
              </div>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="p-8 text-center text-xs opacity-60">
                {language === 'nl'
                  ? 'Geen berichten gevonden voor deze zoekopdracht of filter.'
                  : 'No posts found matching this search or filter.'}
              </div>
            ) : (
              <div className="divide-y divide-inherit/20">
                {filteredPosts.map(post => {
                  const board = boards.find(b => b.id === post.boardId);
                  const isEncrypted = post.isEncrypted;
                  const dateStr = new Date(post.createdAt).toLocaleDateString('nl-NL', {
                    day: '2-digit',
                    month: 'short',
                  });

                  return (
                    <div
                      key={post.id}
                      onClick={() => {
                        sound.keyClick();
                        setSelectedPostId(post.id);
                      }}
                      className="px-3 py-2 text-xs grid grid-cols-12 gap-2 hover:bg-white/5 cursor-pointer transition-colors items-center"
                    >
                      <div className="col-span-6 sm:col-span-7 flex items-center gap-2 min-w-0">
                        {isEncrypted ? (
                          <span title="End-to-End Versleuteld">
                            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          </span>
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5 opacity-60 shrink-0" />
                        )}
                        <span className="font-bold truncate hover:underline">{post.title}</span>
                        {board && (
                          <span className="hidden md:inline text-[10px] opacity-60 shrink-0">
                            [{board.code}]
                          </span>
                        )}
                      </div>

                      <div className="col-span-3 sm:col-span-3 truncate text-xs opacity-85">
                        <span>{post.author}</span>
                        {post.callsign && (
                          <span className="hidden sm:inline opacity-60 ml-1">({post.callsign})</span>
                        )}
                      </div>

                      <div className="col-span-3 sm:col-span-2 text-right text-xs opacity-75 tabular-nums flex items-center justify-end gap-1.5">
                        <span>{post.repliesCount || 0}r</span>
                        <span aria-hidden="true">·</span>
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Thread Viewer View */
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-inherit/40 pb-2">
            <button
              onClick={() => {
                sound.keyClick();
                setSelectedPostId(null);
              }}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 border border-inherit/40 hover:bg-white/10"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>TERUG NAAR BERICHTENOVERZICHT</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  sound.keyClick();
                  setIsShareModalOpen(true);
                }}
                className="flex items-center gap-1 text-xs px-2.5 py-1 border border-inherit/40 hover:bg-white/10 text-cyan-400"
                title="Deel dit bericht via social link, tekstkaart of QR-code"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>DEEL BERICHT</span>
              </button>

              <div className="text-xs opacity-70">
                DRAAD ID: <span className="font-mono">{activePost?.id}</span>
              </div>
            </div>
          </div>

          {activePost && (
            <div className="border border-inherit/50 p-4 bg-black/30 space-y-3">
              {/* Post Metadata Header */}
              <div className="border-b border-inherit/30 pb-2 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
                    {activePost.isEncrypted && <Lock className="w-4 h-4 text-amber-400" />}
                    <span>{activePost.title}</span>
                  </h2>
                  <span className="text-[11px] opacity-60">v{activePost.version}</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] opacity-75 flex-wrap">
                  <span>Auteur: <strong>{activePost.author}</strong> {activePost.callsign && `(${activePost.callsign})`}</span>
                  <span aria-hidden="true">·</span>
                  <span>Node #{activePost.authorNode || 1}</span>
                  <span aria-hidden="true">·</span>
                  <span>{new Date(activePost.createdAt).toLocaleString('nl-NL')}</span>
                  {activePost.tags.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Tags: {activePost.tags.join(', ')}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Post Body (Plain or E2EE) */}
              <div className="py-2 text-xs sm:text-sm leading-relaxed min-h-[80px]">
                {activePost.isEncrypted ? (
                  decryptedCache[activePost.id] ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-[11px] text-emerald-400 border border-emerald-800/60 bg-emerald-950/20 px-2 py-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Ontsleuteld met uw lokale sleutel</span>
                      </div>
                      <AnsiRenderer text={decryptedCache[activePost.id]} />
                    </div>
                  ) : (
                    <div className="border border-amber-600/60 bg-amber-950/30 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400 font-bold">
                        <Lock className="w-4 h-4" />
                        <span>Dit bericht is beveiligd met end-to-end encryptie (AES-256-GCM).</span>
                      </div>
                      <p className="text-xs opacity-80">
                        Alleen bevoegde nodes met de juiste herstelsleutelzin kunnen de inhoud bekijken.
                      </p>
                      <button
                        onClick={() => handleDecryptPost(activePost)}
                        disabled={decryptingIds[activePost.id]}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-black font-bold text-xs hover:bg-amber-400"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>{decryptingIds[activePost.id] ? 'BEZIG MET ONTSLEUTELEN...' : 'ONTSLEUTEL MET MIJN SLEUTEL'}</span>
                      </button>
                    </div>
                  )
                ) : (
                  <AnsiRenderer text={activePost.content} />
                )}
              </div>
            </div>
          )}

          {/* Replies Section */}
          <div className="space-y-3 border-t border-inherit/40 pt-4">
            <h3 className="text-xs font-bold tracking-wider opacity-85">
              REACTIES OP DIT BERICHT ({activeReplies.length})
            </h3>

            {activeReplies.length === 0 ? (
              <div className="p-4 border border-dashed border-inherit/30 text-xs text-center opacity-60">
                Nog geen reacties geplaatst. Wees de eerste om te reageren!
              </div>
            ) : (
              <div className="space-y-2">
                {activeReplies.map((reply, idx) => (
                  <div key={reply.id} className="border border-inherit/30 p-3 bg-black/20 text-xs space-y-1">
                    <div className="flex items-center justify-between opacity-75 text-[11px]">
                      <span>#{idx + 1} door <strong>{reply.author}</strong> {reply.callsign && `(${reply.callsign})`}</span>
                      <span>{new Date(reply.createdAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="pt-1">
                      <AnsiRenderer text={reply.content} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Reply Composer */}
            <form onSubmit={handleCreateReply} className="border border-inherit/40 p-3 bg-black/30 space-y-2">
              <div className="text-xs font-bold opacity-80">SNEL REAGEREN:</div>
              <textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="Typ uw reactie hier (ANSI opmaak ondersteund)..."
                rows={3}
                className="w-full bg-black/50 border border-inherit/40 p-2 text-xs font-mono outline-none focus:border-current"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer opacity-80 select-none">
                  <input
                    type="checkbox"
                    checked={replyIsEncrypted}
                    onChange={e => setReplyIsEncrypted(e.target.checked)}
                    className="accent-current"
                  />
                  <span>Reageer versleuteld</span>
                </label>

                <button
                  type="submit"
                  className="flex items-center gap-1 px-3 py-1 bg-current text-black font-bold text-xs hover:opacity-90"
                >
                  <Send className="w-3 h-3" />
                  <span>PLAATS REACTIE</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Post Modal / Drawer */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4">
          <div className="border-2 border-inherit bg-neutral-950 text-inherit w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-inherit/40 pb-2">
              <h3 className="font-bold text-sm tracking-wide">
                [+] NIEUW BERICHT PLAATSEN OP DE BBS
              </h3>
              <button
                onClick={() => setIsComposerOpen(false)}
                className="px-2 py-0.5 border border-inherit/40 hover:bg-white/10 text-xs font-bold"
              >
                [SLUITEN / ESC]
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3 text-xs">
              {/* Select Board */}
              <div>
                <label className="block mb-1 opacity-75">DOELBORD:</label>
                <select
                  value={composerBoardId}
                  onChange={e => setComposerBoardId(e.target.value)}
                  className="w-full bg-black border border-inherit/50 p-1.5 text-xs font-mono text-inherit outline-none"
                >
                  {boards.map(b => (
                    <option key={b.id} value={b.id}>
                      [{b.code}] {b.name} {b.isEncrypted ? '(E2EE Verplicht)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block mb-1 opacity-75">ONDERWERP / TITEL:</label>
                <input
                  type="text"
                  required
                  placeholder="Bijv. Verslag wijkoverleg of noodfrequenties..."
                  value={composerTitle}
                  onChange={e => setComposerTitle(e.target.value)}
                  className="w-full bg-black border border-inherit/50 p-2 text-xs font-mono text-inherit outline-none focus:border-current"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block mb-1 opacity-75">TAGS (KOMMA-GESCHEIDEN):</label>
                <input
                  type="text"
                  placeholder="noodstroom, mesh, antenne, lokaal"
                  value={composerTags}
                  onChange={e => setComposerTags(e.target.value)}
                  className="w-full bg-black border border-inherit/50 p-2 text-xs font-mono text-inherit outline-none"
                />
              </div>

              {/* E2EE Checkbox */}
              <div className="border border-inherit/30 p-2.5 bg-inherit/5 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                  <input
                    type="checkbox"
                    checked={composerIsEncrypted}
                    onChange={e => setComposerIsEncrypted(e.target.checked)}
                    className="accent-current"
                  />
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>End-to-End Encryptie (E2EE) inschakelen voor dit bericht</span>
                  </span>
                </label>
                <p className="text-[11px] opacity-70 ml-5">
                  Berichtinhoud wordt direct in de browser versleuteld met AES-256-GCM. Alleen gebruikers met de geldige herstelsleutelzin kunnen de tekst lezen.
                </p>
              </div>

              {/* ANSI Toolbar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="opacity-75">BERICHTINHOUD (ANSI ESCAPES ONDERSTEUND):</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setComposerPreviewMode(!composerPreviewMode)}
                      className="px-2 py-0.5 border border-inherit/40 text-[11px] hover:bg-white/10 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{composerPreviewMode ? 'BEWERKMODUS' : 'ANSI PREVIEW'}</span>
                    </button>
                  </div>
                </div>

                {/* ANSI Quick Inserts */}
                <div className="flex items-center gap-1 flex-wrap p-1.5 bg-black border border-inherit/30 text-[10px]">
                  <span className="opacity-60 mr-1">KLEUREN:</span>
                  <button
                    type="button"
                    onClick={() => insertAnsiCode(ANSI.RED)}
                    className="px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-800"
                  >
                    ROOD
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAnsiCode(ANSI.GREEN)}
                    className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800"
                  >
                    GROEN
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAnsiCode(ANSI.YELLOW)}
                    className="px-1.5 py-0.5 bg-amber-950 text-amber-400 border border-amber-800"
                  >
                    GEEL
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAnsiCode(ANSI.CYAN)}
                    className="px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800"
                  >
                    CYAAN
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAnsiCode(ANSI.MAGENTA)}
                    className="px-1.5 py-0.5 bg-purple-950 text-purple-400 border border-purple-800"
                  >
                    MAGENTA
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAnsiCode(ANSI.BOLD)}
                    className="px-1.5 py-0.5 border border-inherit/40 font-bold"
                  >
                    VET
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAnsiCode(ANSI.RESET)}
                    className="px-1.5 py-0.5 border border-inherit/40 opacity-70"
                  >
                    [RESET]
                  </button>
                </div>

                {composerPreviewMode ? (
                  <div className="w-full h-44 bg-black border border-inherit/50 p-3 overflow-y-auto font-mono text-xs whitespace-pre-wrap">
                    <AnsiRenderer text={composerContent || '(Nog geen inhoud getypt...)'} />
                  </div>
                ) : (
                  <textarea
                    required
                    rows={8}
                    value={composerContent}
                    onChange={e => setComposerContent(e.target.value)}
                    placeholder="Typ uw discussiebericht. Gebruik eventueel de ANSI kleurtags hierboven..."
                    className="w-full bg-black border border-inherit/50 p-2 text-xs font-mono text-inherit outline-none focus:border-current"
                  />
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-inherit/40">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-4 py-2 border border-inherit/40 hover:bg-white/10"
                >
                  ANNULEREN
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-current text-black font-bold hover:opacity-90 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>BERICHT VERZENDEN NAAR BORD</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Social & P2P QR Sharing Modal */}
      {isShareModalOpen && activePost && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4">
          <div className="border-2 border-inherit bg-neutral-950 text-inherit w-full max-w-lg p-4 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-inherit/40 pb-2">
              <span className="font-bold text-sm tracking-wide flex items-center gap-2 text-cyan-400">
                <Share2 className="w-4 h-4" />
                <span>BERICHT DELEN & SAMENWERKING</span>
              </span>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-2 py-0.5 border border-inherit/40 hover:bg-white/10 text-xs font-bold"
              >
                [X]
              </button>
            </div>

            <p className="text-[11px] opacity-75 leading-relaxed">
              Deel deze discussie direct met buren via de browser-share api, kopieer een compacte terminalkaart of scan de offline QR-code.
            </p>

            {/* Formatted Text Preview Card */}
            <div className="p-3 bg-black border border-inherit/30 space-y-1.5 select-all">
              <div className="text-[10px] opacity-60">TERMINAL KAART:</div>
              <pre className="text-[11px] whitespace-pre-wrap leading-tight text-current opacity-90">
{`[BBS POST] ${activePost.title}
Auteur: ${activePost.author} (${activePost.callsign || 'Node #1'})
Kanaal: ${boards.find(b => b.id === activePost.boardId)?.name || 'Algemeen'}
Datum: ${new Date(activePost.createdAt).toLocaleDateString()}
${activePost.isEncrypted ? '[E2EE VERSLEUTELD]' : stripAnsi(activePost.content).slice(0, 160) + '...'}`}
              </pre>
            </div>

            {/* Offline P2P ASCII QR matrix simulation */}
            <div className="border border-inherit/30 p-2.5 bg-black/50 text-center space-y-1">
              <div className="font-mono text-[9px] leading-none opacity-80 inline-block">
                <pre>
{`█▀▀▀▀▀█ ▄█▄ █▀▀▀▀▀█
█ ███ █ █ █ █ ███ █
█ ▀▀▀ █ █▀█ █ ▀▀▀ █
▀▀▀▀▀▀▀ ▀ ▀ ▀▀▀▀▀▀▀
██▀▄█▀▄█▀█▀▄██▀▄█▀▄
█▀▀▀▀▀█ █▄█ █ ▀ ▄▀█
█ ███ █ ▄▀█ █▀█▀███
█ ▀▀▀ █ ▀ █ ▄▀█▀█▀█
▀▀▀▀▀▀▀ ▀ ▀ ▀ ▀▀  ▀`}
                </pre>
              </div>
              <div className="text-[10px] opacity-60">
                OFFLINE P2P MESH OVERDRACHT QR
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-inherit/40">
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={() => {
                    sound.execute();
                    navigator
                      .share({
                        title: activePost.title,
                        text: `[BBS] ${activePost.title} door ${activePost.author}\n\n${stripAnsi(activePost.content).slice(0, 200)}`,
                        url: window.location.href,
                      })
                      .catch(() => {});
                  }}
                  className="px-3 py-1.5 border border-cyan-500 text-cyan-400 font-bold hover:bg-cyan-950/40"
                >
                  SYSTEEM DEELMENU
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  sound.keyClick();
                  const shareText = `[BBS POST] ${activePost.title}\nAuteur: ${activePost.author} (${activePost.callsign || 'Node #1'})\nInhoud: ${stripAnsi(activePost.content)}`;
                  navigator.clipboard.writeText(shareText);
                  setCopiedShareText(true);
                  setTimeout(() => setCopiedShareText(false), 2000);
                }}
                className="px-4 py-1.5 bg-current text-black font-bold hover:opacity-90 flex items-center gap-1.5 ml-auto"
              >
                {copiedShareText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedShareText ? 'GEKOPIEERD NAAR KLEMBORD!' : 'KOPIEER TEKSTKAART'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
