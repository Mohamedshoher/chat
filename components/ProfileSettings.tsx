
import React from 'react';
import { User } from '../types';

interface ProfileSettingsProps {
  user: User;
  onClose: () => void;
  onLogout?: () => void;
}


const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onClose, onLogout }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/50 animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center border-b border-black/5 bg-gradient-to-br from-teal-50 to-blue-50 relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 hover:bg-white/60 rounded-full transition-colors text-slate-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>

          <div className="relative inline-block mb-4">
            <div className="p-1 bg-white rounded-full shadow-lg">
              <img src={user.avatar} className="w-24 h-24 rounded-full border-2 border-white" alt="" />
            </div>
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full shadow-sm"></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">{user.name}</h2>
          <p className="text-teal-600 text-sm font-medium">@{user.role === 'admin' ? 'admin_master' : 'zchat_user'}</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-base">
              <span className="text-slate-500 font-medium">الرتبة</span>
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${user.role === 'admin' ? 'bg-amber-100/80 text-amber-700 border border-amber-200' : 'bg-teal-100/80 text-teal-700 border border-teal-200'}`}>
                {user.role === 'admin' ? 'مدير نظام' : 'مستخدم'}
              </span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="text-slate-500 font-medium">حالة الاتصال</span>
              <span className="text-green-600 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                متصل الآن
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col gap-3">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-all border border-red-200 font-bold shadow-sm hover:shadow-md active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              تسجيل الخروج
            </button>

            <button onClick={onClose} className="w-full py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors">
              إغلاق الإعدادات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
