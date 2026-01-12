
import React, { useState } from 'react';
import { User } from '../types';

interface AdminPanelProps {
  users: User[];
  onAddUser: (user: Partial<User>) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, onClose }) => {
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('manage');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [searchTerm, setSearchTerm] = useState('');

  // حالة تعديل مستخدم معين
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const handleAdd = () => {
    if (name && password) {
      onAddUser({ 
        name, 
        password, 
        role, 
        avatar: `https://picsum.photos/seed/${name}/200`,
        status: 'offline'
      });
      setName('');
      setPassword('');
      alert('تمت إضافة المستخدم بنجاح!');
      setActiveTab('manage');
    }
  };

  const startEditing = (user: User) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditPassword(user.password || '');
  };

  const handleSaveEdit = () => {
    if (editingUserId && editName && editPassword) {
      onUpdateUser(editingUserId, { name: editName, password: editPassword });
      setEditingUserId(null);
      alert('تم تحديث بيانات المستخدم بنجاح!');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-700/50 flex items-center justify-between border-b border-slate-600">
          <h2 className="text-xl font-bold text-teal-400 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeWidth="2" strokeLinecap="round"/></svg>
            لوحة تحكم المدير
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-600 rounded-full transition-colors text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button 
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'manage' ? 'text-teal-400 border-b-2 border-teal-400 bg-teal-400/5' : 'text-slate-400 hover:text-slate-200'}`}
          >
            إدارة المستخدمين
          </button>
          <button 
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'add' ? 'text-teal-400 border-b-2 border-teal-400 bg-teal-400/5' : 'text-slate-400 hover:text-slate-200'}`}
          >
            إضافة مستخدم جديد
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'add' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">اسم المستخدم الجديد</label>
                  <input 
                    className="w-full bg-slate-900 border-none rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="أدخل الاسم..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">كلمة المرور</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-900 border-none rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="أدخل كلمة المرور..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">الصلاحية</label>
                  <select 
                    className="w-full bg-slate-900 border-none rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-teal-500"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                  >
                    <option value="user">مستخدم عادي</option>
                    <option value="admin">مدير نظام</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleAdd}
                className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20"
              >
                تأكيد الإضافة
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="relative mb-4">
                <input 
                  type="text" 
                  placeholder="بحث عن مستخدم..." 
                  className="w-full bg-slate-900 border-none rounded-xl py-2 px-10 focus:ring-2 focus:ring-teal-500 text-sm text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" /></svg>
              </div>

              <div className="space-y-2">
                {filteredUsers.map(user => (
                  <div key={user.id} className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} className="w-10 h-10 rounded-full border border-slate-600" alt="" />
                        <div>
                          <p className="font-bold text-slate-100">{user.name}</p>
                          <p className="text-[10px] text-teal-500 font-mono">ID: {user.id}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => startEditing(user)}
                          className="p-2 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <button 
                          onClick={() => onDeleteUser(user.id)}
                          className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                    </div>

                    {editingUserId === user.id && (
                      <div className="mt-2 p-4 bg-slate-800 rounded-xl border border-teal-500/30 space-y-4 animate-in slide-in-from-top-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] text-slate-500 mb-1 block">تغيير الاسم</label>
                            <input 
                              className="w-full bg-slate-900 border-none rounded-lg p-2 text-sm text-white"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 mb-1 block">تغيير الرقم السري</label>
                            <input 
                              type="text"
                              className="w-full bg-slate-900 border-none rounded-lg p-2 text-sm text-white"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                           <button onClick={() => setEditingUserId(null)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">إلغاء</button>
                           <button onClick={handleSaveEdit} className="px-4 py-2 bg-teal-500 text-slate-900 text-xs font-bold rounded-lg hover:bg-teal-400">حفظ التغييرات</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-slate-500 py-10 italic">لا يوجد مستخدمين بهذا الاسم</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
