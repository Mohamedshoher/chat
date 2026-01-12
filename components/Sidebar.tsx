
import React, { useState } from 'react';
import { Chat } from '../types';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onChatSelect: (id: string) => void;
  onProfileClick: () => void;
  isAdmin?: boolean;
  onAdminClick?: () => void;
  currentUserId: string;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ chats, activeChatId, onChatSelect, onProfileClick, isAdmin, onAdminClick, currentUserId, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChats = chats.filter(chat => {
    const partner = chat.participants.find(p => p.id !== currentUserId);
    return partner?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <aside className="w-full flex flex-col border-l border-white/20 bg-white/40 backdrop-blur-md shrink-0 shadow-xl z-20">
      <div className="p-4 flex items-center justify-between gap-4 border-b border-black/5">
        <button
          onClick={onProfileClick}
          className="w-10 h-10 rounded-full bg-white/50 overflow-hidden hover:opacity-80 transition-opacity border-2 border-teal-500 shadow-md"
        >
          <img src={`https://picsum.photos/seed/${currentUserId}/200`} alt="Avatar" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">Z-Chat</h1>
        </div>
        <div className="flex gap-1">
          {isAdmin && (
            <button
              onClick={onAdminClick}
              className="p-2 bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 rounded-full transition-colors"
              title="إضافة مستخدم جديد"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}
          <button
            onClick={onLogout}
            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-full transition-colors"
            title="تسجيل الخروج"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="relative group">
          <input
            type="text"
            placeholder="بحث في المحادثات..."
            className="w-full bg-white/50 border border-transparent focus:border-teal-500/30 rounded-xl py-2 px-10 focus:ring-2 focus:ring-teal-500/20 text-sm text-slate-700 shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 group-focus-within:text-teal-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" /></svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredChats.length > 0 ? (
          filteredChats.map(chat => {
            const partner = chat.participants.find(p => p.id !== currentUserId);
            if (!partner) return null;

            const lastMsg = chat.messages[chat.messages.length - 1];

            return (
              <button
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className={`w-full flex items-center p-4 gap-4 hover:bg-white/40 transition-all border-b border-transparent ${activeChatId === chat.id ? 'bg-white/60 border-r-4 border-r-teal-500 shadow-sm' : 'hover:border-slate-100'}`}
              >
                <div className="relative shrink-0">
                  <img src={partner.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt={partner.name} />
                  {partner.status === 'online' && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 text-right overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800 truncate">{partner.name}</span>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-xs truncate ${activeChatId === chat.id ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                      {lastMsg?.senderId === currentUserId ? 'أنت: ' : ''}
                      {lastMsg?.text || 'ابدأ المحادثة الآن'}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] shadow-sm">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="p-10 text-center opacity-40 text-sm italic text-slate-600">لا توجد محادثات نشطة</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
