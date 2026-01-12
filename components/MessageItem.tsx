
import React, { useState } from 'react';
import { Message } from '../types';

interface MessageItemProps {
  message: Message;
  isMe: boolean;
  onDelete: () => void;
  onPin: () => void;
  onReact: (emoji: string) => void;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];


const MessageItem: React.FC<MessageItemProps> = ({ message, isMe, onDelete, onPin, onReact }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  return (
    <div className={`flex w-full ${isMe ? 'justify-start' : 'justify-end'} group relative mb-4`}>
      <div className={`relative flex flex-col ${isMe ? 'items-start' : 'items-end'} max-w-[85%]`}>

        {/* Reaction Picker - Vertical Side Panel */}
        <div className={`absolute top-0 z-50 flex flex-col gap-1.5 p-1.5 rounded-full glass-panel shadow-lg transition-all duration-300 ${isMe ? '-left-10 -translate-x-2' : '-right-10 translate-x-2'
          } ${showReactionPicker ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-75 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100'}`}>
          <div className="absolute inset-0 bg-white/80 backdrop-blur-md rounded-full -z-10 shadow-sm"></div>
          {QUICK_REACTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => { onReact(emoji); setShowReactionPicker(false); }}
              className="hover:scale-125 transition-transform p-1 text-lg leading-none filter drop-shadow-sm active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>

        <div
          className={`p-3 rounded-2xl relative shadow-md transition-all ${isMe
            ? 'bg-gradient-to-tr from-teal-500 to-blue-500 text-white rounded-br-none shadow-teal-500/20'
            : 'bg-white text-slate-800 rounded-bl-none border border-slate-100 shadow-sm'
            } ${message.isPinned ? 'border-r-4 border-yellow-400 bg-yellow-50/50' : ''}`}
          onContextMenu={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
          onClick={() => setShowReactionPicker(!showReactionPicker)}
        >
          {message.isPinned && (
            <div className="flex items-center gap-1 mb-1 text-[10px] text-yellow-500 font-bold">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
              <span>مثبتة</span>
            </div>
          )}

          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>

          <div className={`flex items-center gap-1 mt-1 justify-end text-[10px] ${isMe ? 'text-teal-100' : 'text-slate-400'}`}>
            <span>{new Date(message.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
            {isMe && (
              <span title={message.status}>
                {message.status === 'READ' ? (
                  <div className="flex -space-x-1 text-blue-200">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </div>
                ) : message.status === 'DELIVERED' ? (
                  <div className="flex -space-x-1 text-slate-200">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </div>
                ) : (
                  <svg className="w-3 h-3 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                )}
              </span>
            )}
          </div>

          {/* Action Menu */}
          {showMenu && (
            <div className={`absolute top-0 ${isMe ? 'left-full ml-2' : 'right-full mr-2'} bg-white/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl py-1 z-30 w-32`}>
              <button onClick={() => { onPin(); setShowMenu(false); }} className="w-full text-right px-4 py-2 text-xs hover:bg-slate-100 text-slate-700 flex items-center gap-2 transition-colors">
                <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeWidth="2" /></svg>
                {message.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
              </button>
              <button onClick={() => { onDelete(); setShowMenu(false); }} className="w-full text-right px-4 py-2 text-xs hover:bg-red-50 text-red-500 flex items-center gap-2 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" /></svg>
                حذف الرسالة
              </button>
            </div>
          )}
        </div>

        {/* Display Reactions */}
        {/* Display Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`absolute -bottom-3 z-10 flex flex-wrap gap-1 ${isMe ? 'right-4' : 'left-4'}`}>
            <div className={`flex items-center gap-1 p-1 pr-2 pl-2 rounded-full shadow-sm bg-white border border-slate-100`}>
              {message.reactions.map(r => (
                <button
                  key={r.emoji}
                  onClick={() => onReact(r.emoji)}
                  className={`flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[10px] transition-transform hover:scale-110 ${r.me
                    ? 'bg-blue-100/50 text-blue-600 font-bold'
                    : 'bg-transparent text-slate-600'
                    }`}
                >
                  <span className="text-sm leading-none">{r.emoji}</span>
                  {r.count > 1 && <span className="opacity-80 ml-0.5">{r.count}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MessageItem;
