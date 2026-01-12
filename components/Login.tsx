
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (name: string, pass: string) => void;
  // onRegister removed as public registration is disabled
  error?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, error }) => {
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(name, pass);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-100 flex items-center justify-center p-4 bg-[url('https://img.freepik.com/free-vector/white-abstract-background-design_23-2148825582.jpg?w=1380&t=st=1686663584~exp=1686664184~hmac=62174272183c070444520448135804550882772588888744888888888888888')] bg-cover bg-center">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 relative animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-tr from-teal-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20 animate-bounce">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-1">Z-Chat</h1>
          <p className="text-slate-500 font-medium">مرحباً بك في نظام المحادثات الذكي</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">اسم المستخدم</label>
            <div className="relative">
              <input
                type="text"
                required
                className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3.5 focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-slate-800 transition-all font-medium shadow-sm"
                placeholder="اسم المستخدم..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">كلمة المرور</label>
            <div className="relative">
              <input
                type="password"
                required
                className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3.5 focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-slate-800 transition-all font-medium shadow-sm"
                placeholder="••••••••"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
              <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm text-center border border-red-100 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 hover:-translate-y-1 flex items-center justify-center gap-2"
          >
            <span>دخول النظام</span>
            <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
          </button>
        </form>

        <p className="text-center text-slate-400 text-xs mt-8">
          نظام محمي وآمن. للإدارة فقط حق إنشاء الحسابات.
        </p>
      </div>
    </div>
  );
};

export default Login;
