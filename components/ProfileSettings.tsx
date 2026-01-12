
import React from 'react';
import { User } from '../types';

interface ProfileSettingsProps {
  user: User;
  onClose: () => void;
  onLogout?: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onClose, onLogout }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
        <div className="p-6 text-center border-b border-slate-700 bg-gradient-to-b from-slate-700 to-slate-800 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 p-2 hover:bg-slate-600 rounded-full transition-colors text-slate-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          
          <div className="relative inline-block">
             <img src={user.avatar} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-teal-500 shadow-xl" alt="" />
             <div className="absolute bottom-2 right-0 w-6 h-6 bg-green-500 border-4 border-slate-800 rounded-full"></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-100">{user.name}</h2>
          <p className="text-teal-400 text-sm font-medium">@{user.role === 'admin' ? 'admin_master' : 'zchat_user'}</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
             <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">الرتبة</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-500' : 'bg-teal-500/20 text-teal-500'}`}>
                  {user.role === 'admin' ? 'مدير نظام' : 'مستخدم'}
                </span>
             </div>
             <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">حالة الاتصال</span>
                <span className="text-green-400">متصل الآن</span>
             </div>
          </div>

          <div className="pt-4 border-t border-slate-700 flex flex-col gap-3">
             <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-3 p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors border border-red-500/20 font-bold"
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                تسجيل الخروج
             </button>
             
             <button onClick={onClose} className="w-full py-3 bg-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-600 transition-colors">
               إغلاق الإعدادات
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
