
import React, { useState, useRef, useEffect } from 'react';
import { Chat, Message, ChatSettings } from '../types';
import MessageItem from './MessageItem';

interface ChatWindowProps {
  chat: Chat;
  onSendMessage: (text: string) => void;
  onDeleteMessage: (id: string) => void;
  onPinMessage: (id: string) => void;
  onReactToMessage: (messageId: string, emoji: string) => void;
  onUpdateSettings: (settings: Partial<ChatSettings>) => void;
  onStartVideoCall: () => void;
  onBack: () => void;
  onTyping: (isTyping: boolean) => void;
  currentUserId: string;
}


const ChatWindow: React.FC<ChatWindowProps> = ({ chat, onSendMessage, onDeleteMessage, onPinMessage, onReactToMessage, onUpdateSettings, onStartVideoCall, onBack, onTyping, currentUserId }) => {
  const [inputText, setInputText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const partner = chat.participants.find(p => p.id !== currentUserId)!;
  const pinnedMessages = chat.messages.filter(m => m.isPinned);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat.messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const emojis = ["😊", "😂", "❤️", "😍", "🙌", "👍", "🔥", "😭", "😮", "🤔", "👋", "🎉"];

  const sounds: { id: ChatSettings['selectedSound'], label: string }[] = [
    { id: 'default', label: 'افتراضي' },
    { id: 'soft', label: 'ناعم' },
    { id: 'alert', label: 'تنبيه حاد' },
    { id: 'melody', label: 'لحن هادئ' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative">
      <div className="absolute inset-0 z-[-1] opacity-5 pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]"></div>

      {/* Header */}
      <header className="p-3 bg-white/40 backdrop-blur-md flex items-center justify-between border-b border-white/30 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 md:hidden hover:bg-white/50 rounded-full transition-colors text-slate-600"
          >
            <svg className="w-6 h-6 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>

          <div className="relative">
            <img src={partner.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt={partner.name} />
            {partner.status === 'online' && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>}
          </div>

          <div className="overflow-hidden">
            <h3 className="font-bold text-slate-800 truncate text-sm md:text-base">{partner.name}</h3>
            <p className="text-[10px] md:text-xs text-teal-600 font-medium animate-pulse">
              {chat.typing && chat.typing[partner.id] ? 'يكتب الآن...' : (
                <>
                  {partner.role === 'admin' ? 'مدير النظام' : 'مستخدم'} • {partner.status === 'online' ? 'متصل الآن' : 'غير متصل'}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 text-slate-600">
          <button onClick={onStartVideoCall} className="p-2 hover:bg-white/50 rounded-full transition-colors" title="مكالمة فيديو">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-teal-100 text-teal-700' : 'hover:bg-white/50'}`}
              title="إعدادات الدردشة"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>

            {showSettings && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in duration-200">
                <h4 className="font-bold text-teal-600 mb-4 pb-2 border-b border-black/5">تحكم بالدردشة</h4>
                <div className="space-y-4 text-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">تنبيهات الصوت</span>
                    <button
                      onClick={() => onUpdateSettings({ soundEnabled: !chat.settings.soundEnabled })}
                      className={`w-10 h-5 md:w-12 md:h-6 rounded-full transition-colors relative ${chat.settings.soundEnabled ? 'bg-teal-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full transition-all shadow-sm ${chat.settings.soundEnabled ? 'left-6 md:left-7' : 'left-1'}`}></div>
                    </button>
                  </div>

                  {chat.settings.soundEnabled && (
                    <div className="space-y-2 animate-in slide-in-from-top-1">
                      <span className="text-xs text-slate-500 block">اختر نغمة التنبيه</span>
                      <div className="grid grid-cols-1 gap-1">
                        {sounds.map(s => (
                          <button
                            key={s.id}
                            onClick={() => onUpdateSettings({ selectedSound: s.id })}
                            className={`text-right px-3 py-2 rounded-lg text-xs transition-colors ${chat.settings.selectedSound === s.id ? 'bg-teal-100 text-teal-800 font-bold border border-teal-200' : 'bg-slate-100/50 text-slate-600 hover:bg-slate-100'}`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm">تدمير ذاتي (24س)</span>
                    <button
                      onClick={() => onUpdateSettings({ autoDeleteEnabled: !chat.settings.autoDeleteEnabled })}
                      className={`w-10 h-5 md:w-12 md:h-6 rounded-full transition-colors relative ${chat.settings.autoDeleteEnabled ? 'bg-teal-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full transition-all shadow-sm ${chat.settings.autoDeleteEnabled ? 'left-6 md:left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Pinned Messages Bar */}
      {pinnedMessages.length > 0 && (
        <div className="bg-white/60 backdrop-blur p-2 flex items-center justify-between border-b border-white/20 shadow-sm z-[5]">
          <div className="flex items-center gap-2 overflow-hidden text-right">
            <svg className="w-4 h-4 text-teal-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
            <span className="text-xs text-slate-700 truncate">رسالة مثبتة: {pinnedMessages[pinnedMessages.length - 1].text}</span>
          </div>
        </div>
      )}

      {/* Message Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {chat.messages.length > 0 ? (
          chat.messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              isMe={msg.senderId === currentUserId}
              onDelete={() => onDeleteMessage(msg.id)}
              onPin={() => onPinMessage(msg.id)}
              onReact={(emoji) => onReactToMessage(msg.id, emoji)}
            />
          ))
        ) : (
          <div className="h-full flex items-center justify-center opacity-30 italic text-slate-500 font-medium">✨ لا توجد رسائل بعد... كن الأول!</div>
        )}
      </div>

      {/* Footer / Input */}
      <footer className="p-2 md:p-4 bg-white/70 backdrop-blur-md border-t border-white/40 relative shadow-2xl">
        {showEmojis && (
          <div className="absolute bottom-full right-4 bg-white/90 backdrop-blur pb-3 pt-3 px-3 rounded-2xl shadow-xl border border-white/50 mb-2 grid grid-cols-6 gap-2 w-[calc(100%-2rem)] md:w-auto z-40">
            {emojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => { setInputText(prev => prev + emoji); setShowEmojis(false); }}
                className="text-2xl hover:scale-125 transition-transform p-2 active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            className={`p-2 transition-colors ${showEmojis ? 'text-teal-500' : 'text-slate-400 hover:text-teal-500'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg>
          </button>

          <input
            type="text"
            placeholder="اكتب رسالة..."
            className="flex-1 bg-white border border-slate-200/50 rounded-2xl py-2 md:py-3 px-4 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 placeholder-slate-400 text-sm md:text-base outline-none shadow-sm transition-shadow"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              onTyping(true);
            }}
            onBlur={() => onTyping(false)}
            onKeyDown={handleKeyDown}
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`p-2 md:p-3 rounded-full transition-all shadow-md ${inputText.trim() ? 'bg-gradient-to-tr from-teal-500 to-blue-500 text-white transform scale-100 hover:shadow-lg' : 'bg-slate-200 text-slate-400 scale-90 cursor-not-allowed'}`}
          >
            <svg className="w-6 h-6 rotate-180" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
          </button>
        </div>
      </footer>
    </div>
  );
};


export default ChatWindow;
