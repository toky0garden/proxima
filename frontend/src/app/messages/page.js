'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useApp } from '../AppContext';
import * as api from '../../lib/api';

export default function Messages() {
  const {
    chats,
    activeChatId,
    setActiveChatId,
    sendMessage,
    clearChatHistory,
    blockChatUser,
    addToast,
    isAuthenticated,
    authLoading,
    user,
  } = useApp();

  const [messageText, setMessageText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const chatEndRef = useRef(null);
  const [currentMessages, setCurrentMessages] = useState([]);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  // Load messages for the selected chat from real API
  useEffect(() => {
    if (!authLoading && activeChatId && isAuthenticated) {
      api.listMessages(activeChatId).then(msgs => {
        setCurrentMessages(msgs || []);
      }).catch(() => setCurrentMessages([]));
    }
  }, [activeChatId, authLoading, isAuthenticated]);

  // Scroll to bottom when messages change or chat switch
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat?.messages, activeChatId]);

  if (authLoading) {
    return <main className="w-full max-w-screen-xl mx-auto px-6 py-8 flex-1 flex items-center justify-center text-center">
      <p className="text-xs text-brand-textMuted">Загрузка...</p>
    </main>;
  }

  if (!isAuthenticated) {
    return (
      <main className="w-full max-w-screen-md mx-auto px-6 py-12">
        <div className="bg-brand-card border border-brand-border rounded-3xl p-8 space-y-6 text-center">
          <h1 className="text-2xl font-bold">Чаты</h1>
          <p className="text-sm text-brand-textMuted">
            Вам необходимо войти в аккаунт или зарегистрироваться, чтобы открыть чаты.
          </p>
          <Link
            href="/profile"
            className="inline-block py-3 px-6 bg-brand-red hover:bg-brand-redHover text-white text-sm font-bold rounded-xl"
          >
            Перейти к профилю
          </Link>
        </div>
      </main>
    );
  }

  const handleSend = async (e) => {
    e.preventDefault();
    const text = messageText.trim();
    if (!text) return;
    await sendMessage(activeChat.id, text);
    // reload messages
    try {
      const msgs = await api.listMessages(activeChat.id);
      setCurrentMessages(msgs || []);
    } catch {}
    setMessageText('');
  };

  const handleEmojiClick = (em) => {
    setMessageText(prev => prev + em);
  };

  const handleFileAttach = () => {
    const fileNames = ['screenshot_payment.png', 'credentials.txt', 'config.cfg', 'backup_codes.txt'];
    const randomName = fileNames[Math.floor(Math.random() * fileNames.length)];
    sendMessage(activeChat.id, `📎 Прикрепленный файл: ${randomName}`);
    addToast(`Файл "${randomName}" успешно прикреплен.`, 'success');
  };

  const emojis = ['🎮', '🔥', '👍', '📦', '💬', '⭐', '🤝', '😎'];

  if (!activeChat) {
    return (
      <main className="w-full max-w-screen-xl mx-auto px-6 py-8 flex-1 flex items-center justify-center text-center">
        <p className="text-xs text-brand-textMuted">Загрузка переписок...</p>
      </main>
    );
  }

  return (
    <main className="w-full max-w-screen-xl mx-auto px-6 py-8 flex-1 flex flex-col min-h-[calc(100vh-140px)] animate-fadeInUp">
      <div className="flex-1 bg-brand-card rounded-3xl border border-brand-border overflow-hidden grid grid-cols-1 md:grid-cols-3 shadow-glass">
        
        {/* Left Side: Chats list */}
        <div className="border-r border-brand-border flex flex-col h-full bg-white/[0.01]">
          <div className="p-4 border-b border-brand-border bg-white/[0.01]">
            <h2 className="font-bold text-sm text-white">Ваши диалоги</h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-brand-border/40">
            {chats.map((c) => {
              const isActive = c.id === activeChat.id;
              const lastMsg = c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
              
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveChatId(c.id)}
                  className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02] transition-all duration-200 ${
                    isActive ? 'bg-white/5 border-l-2 border-brand-red' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    {c.avatar ? (
                      <img alt="avatar" className="w-11 h-11 rounded-full object-cover border border-white/10" src={c.avatar} />
                    ) : (
                      <div className="w-11 h-11 rounded-full border border-white/10 bg-brand-input" />
                    )}
                    {c.online && (
                      <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-brand-card shadow-glow-green"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-xs text-white truncate">{c.name}</span>
                      <span className="text-[9px] text-brand-textMuted font-light shrink-0 ml-2">12:45</span>
                    </div>
                    <p className="text-xs text-brand-textMuted truncate font-light">
                      {lastMsg ? lastMsg.text : 'Нет сообщений'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Dialog Log */}
        <div className="md:col-span-2 flex flex-col h-full bg-brand-dark/40">
          
          {/* Header */}
          <div className="p-4 border-b border-brand-border flex items-center justify-between bg-brand-card relative">
            <div className="flex items-center gap-3">
              <div className="relative">
                {activeChat.avatar ? (
                  <img alt="avatar" className="w-10 h-10 rounded-full object-cover border border-white/10" src={activeChat.avatar} />
                ) : (
                  <div className="w-10 h-10 rounded-full border border-white/10 bg-brand-input" />
                )}
                {activeChat.online && (
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-brand-card shadow-glow-green"></span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-xs text-white leading-none">{activeChat.name}</h3>
                <span className="text-[10px] text-green-500 font-semibold mt-1 block">
                  {activeChat.online ? 'в сети' : 'был недавно'}
                </span>
              </div>
            </div>

            {/* Menu options */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-brand-textMuted hover:text-white transition-colors"
              >
                <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
              </button>

              {showMenu && (
                <div className="absolute right-0 top-10 bg-brand-card border border-brand-border rounded-xl p-2.5 w-44 shadow-glass z-40 space-y-1">
                  <button
                    onClick={() => { clearChatHistory(activeChat.id); setShowMenu(false); }}
                    className="w-full text-left py-2 px-3 hover:bg-white/5 rounded-lg text-xs text-brand-text font-semibold flex items-center gap-2 transition-colors"
                  >
                    <i className="fa-regular fa-trash-can text-brand-red"></i>
                    <span>Очистить историю</span>
                  </button>
                  <button
                    onClick={() => { blockChatUser(activeChat.id); setShowMenu(false); }}
                    className="w-full text-left py-2 px-3 hover:bg-white/5 rounded-lg text-xs text-brand-text font-semibold flex items-center gap-2 transition-colors"
                  >
                    <i className="fa-solid fa-ban text-brand-red"></i>
                    <span>Заблокировать</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 flex flex-col">
            {currentMessages.length > 0 ? (
              currentMessages.map((msg, index) => {
                const isSender = msg.sender_id === user?.id || msg.sender === 'sender';
                const text = msg.body || msg.text || '';
                const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (msg.time || '');
                return (
                  <div
                    key={index}
                    className={`flex ${isSender ? 'self-end' : 'self-start'} max-w-[70%] animate-fadeInUp`}
                  >
                    <div
                      className={`${
                        isSender
                          ? 'bg-gradient-to-br from-brand-red to-red-700 border border-white/15'
                          : 'bg-brand-input border border-white/5'
                      } py-2.5 px-4 rounded-2xl ${
                        isSender ? 'rounded-tr-sm' : 'rounded-tl-sm'
                      } relative flex items-end gap-3.5 shadow-glass-inset`}
                    >
                      <p className="text-sm leading-relaxed text-white font-light">{text}</p>
                      <div
                        className={`flex items-center gap-1 shrink-0 pb-0.5 text-[9px] ${
                          isSender ? 'text-white/70' : 'text-brand-textMuted'
                        }`}
                      >
                        <span>{time}</span>
                        {isSender && <i className="fa-solid fa-check-double text-[8px]"></i>}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-brand-textMuted py-8">
                <i className="fa-regular fa-comment-dots text-3xl mb-1 opacity-40"></i>
                <p className="text-xs">Сообщений нет. Напишите что-нибудь первым!</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Inputs */}
          <div className="p-4 border-t border-brand-border bg-brand-card space-y-3.5">
            
            {/* Emojis Preset Bar */}
            <div className="flex items-center gap-3.5 px-1">
              <span className="text-[10px] font-bold text-brand-textMuted uppercase tracking-wider">Смайлики:</span>
              <div className="flex gap-2.5">
                {emojis.map(em => (
                  <button
                    key={em}
                    onClick={() => handleEmojiClick(em)}
                    className="hover:scale-125 transition-transform text-sm"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Input fields form */}
            <form onSubmit={handleSend} className="flex gap-3">
              <button
                type="button"
                onClick={handleFileAttach}
                className="w-11 h-11 shrink-0 rounded-xl bg-brand-input border border-brand-border hover:border-brand-textMuted flex items-center justify-center text-brand-textMuted hover:text-white transition-colors"
                title="Прикрепить файл"
              >
                <i className="fa-solid fa-paperclip text-base"></i>
              </button>

              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Введите ваше сообщение..."
                className="flex-1 bg-brand-input border border-brand-border focus:border-brand-red focus:ring-0 rounded-xl py-3 px-4 text-xs text-white focus:outline-none"
                type="text"
              />

              <button
                type="submit"
                className="w-11 h-11 shrink-0 rounded-xl bg-brand-red hover:bg-brand-redHover flex items-center justify-center text-white transition-all shadow-glow-red"
                title="Отправить сообщение"
              >
                <i className="fa-solid fa-paper-plane text-xs"></i>
              </button>
            </form>
          </div>

        </div>

      </div>
    </main>
  );
}
