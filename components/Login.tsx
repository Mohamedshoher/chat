
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (name: string, pass: string) => void;
  onRegister: (name: string, pass: string) => void;
  error?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, error }) => {
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      onRegister(name, pass);
    } else {
      onLogin(name, pass);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0b141a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
            <svg className="w-10 h-10 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-teal-400">Z-Chat</h1>
          <p className="text-slate-400 mt-2">
            {isRegistering ? 'إنشاء حساب جديد' : 'مرحباً بك، سجل دخولك للبدء'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">اسم المستخدم</label>
            <input
              type="text"
              required
              className="w-full bg-slate-900 border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all"
              placeholder="مثلاً: admin أو user1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">كلمة المرور</label>
            <input
              type="password"
              required
              className="w-full bg-slate-900 border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all"
              placeholder="••••••••"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all transform active:scale-95"
          >
            {isRegistering ? 'إنشاء حساب' : 'دخول النظام'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">
            {isRegistering ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}
            <button
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setPass(''); setName(''); }}
              className="text-teal-400 hover:text-teal-300 font-medium mr-2"
            >
              {isRegistering ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </button>
          </p>
        </div>

        <p className="text-center text-slate-500 text-xs mt-8">
          ملاحظة: المدير الافتراضي هو admin
        </p>
      </div>
    </div>
  );
};

export default Login;
