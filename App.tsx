
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import VideoCall from './components/VideoCall';
import ProfileSettings from './components/ProfileSettings';
import ReactionOverlay from './components/ReactionOverlay';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import { User, Chat, Message, MessageStatus, ChatSettings } from './types';
import { auth, db, firebaseConfig } from './firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getAuth,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import {
  collection,
  getDoc,
  query,
  where,
  onSnapshot,
  addDoc,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';

const DEFAULT_SETTINGS: ChatSettings = {
  soundEnabled: true,
  autoDeleteEnabled: false,
  selectedSound: 'default'
};

const App: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Call States
  const [activeCallData, setActiveCallData] = useState<{ id: string, isCaller: boolean, participant: User } | null>(null);
  const [incomingCallData, setIncomingCallData] = useState<{ id: string, participant: User } | null>(null);

  const [showProfile, setShowProfile] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [activeEffect, setActiveEffect] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Initialize Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user data immediately to break deadlock
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUser({ id: userDoc.id, ...userDoc.data() } as User);
        }
      } else {
        setCurrentUser(null);
        setActiveChatId(null);
      }
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Users Collection
  useEffect(() => {
    if (!currentUser) return; // Don't fetch users until logged in

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setAllUsers(users);

      // Update self ref just in case
      if (auth.currentUser) {
        const found = users.find(u => u.id === auth.currentUser?.uid);
        if (found) setCurrentUser(found);
      }
    }, (error) => {
      console.error("Users listener error:", error);
      // Ignore permission errors during auth transition
    });
    return () => unsubscribe();
  }, [currentUser?.id]); // Re-run when user logs in

  // Listen to Chats Collection
  useEffect(() => {
    if (!currentUser) {
      setChats([]);
      return;
    }
    const q = query(
      collection(db, 'chats'),
      where('participantIds', 'array-contains', currentUser.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Sound Logic
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const data = change.doc.data();
          const messages = data.messages || [];
          const settings = data.settings || DEFAULT_SETTINGS;

          if (settings.soundEnabled && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            // Play sound if last message is NOT me and is recent (less than 5s)
            const msgTime = lastMsg.timestamp?.toDate ? lastMsg.timestamp.toDate() : new Date(lastMsg.timestamp);
            const now = new Date();
            if (lastMsg.senderId !== currentUser.id && (now.getTime() - msgTime.getTime() < 5000)) {
              playNotificationSound(settings.selectedSound);
            }
          }
        }
      });

      const loadedChats = snapshot.docs.map(doc => {
        const data = doc.data();
        const messages = (data.messages || []).map((m: any) => {
          const timestamp = m.timestamp?.toDate ? m.timestamp.toDate() : new Date(m.timestamp);
          const reactions = (m.reactions || []).map((r: any) => {
            // If users array exists, use it to determine truth
            if (r.users && Array.isArray(r.users)) {
              return {
                ...r,
                count: r.users.length,
                me: r.users.includes(currentUser.id)
              };
            }
            return r;
          });
          return { ...m, timestamp, reactions };
        });

        const participants = (data.participantIds || []).map((pid: string) => {
          return allUsers.find(u => u.id === pid) || {
            id: pid,
            name: 'Unknown',
            avatar: 'https://via.placeholder.com/150',
            role: 'user',
            status: 'offline'
          } as User;
        });

        return {
          id: doc.id,
          participants,
          messages,
          unreadCount: data.unreadCount || 0,
          settings: data.settings || DEFAULT_SETTINGS,
          typing: data.typing || {}
        } as Chat;
      });
      setChats(loadedChats);
    });

    return () => unsubscribe();
  }, [currentUser?.id, allUsers]);

  // Listen for Incoming Calls
  useEffect(() => {
    if (!currentUser) return;

    // Listen for calls where I am the receiver and status is 'calling'
    const q = query(
      collection(db, 'calls'),
      where('receiverId', '==', currentUser.id),
      where('status', '==', 'calling')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty && !activeCallData) {
        // Just take the first one
        const callDoc = snapshot.docs[0];
        const data = callDoc.data();
        const caller = allUsers.find(u => u.id === data.callerId);

        if (caller) {
          setIncomingCallData({ id: callDoc.id, participant: caller });
        }
      } else if (snapshot.empty) {
        setIncomingCallData(null);
      }
    });

    return () => unsubscribe();
  }, [currentUser, activeCallData, allUsers]);


  // Mark read logic
  useEffect(() => {
    if (!activeChatId || !currentUser) return;
    const markAsRead = async () => {
      const activeChat = chats.find(c => c.id === activeChatId);
      if (!activeChat) return;

      const unreadMessages = activeChat.messages.filter(m => m.senderId !== currentUser.id && m.status !== MessageStatus.READ);

      if (unreadMessages.length > 0) {
        const updatedMessages = activeChat.messages.map(m => {
          if (m.senderId !== currentUser.id && m.status !== MessageStatus.READ) {
            return { ...m, status: MessageStatus.READ };
          }
          return m;
        });
        await updateDoc(doc(db, 'chats', activeChatId), {
          messages: updatedMessages
        });
      }
    };
    markAsRead();
  }, [activeChatId, chats, currentUser]);

  // Cleanup Expired Messages
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      chats.forEach(async (chat) => {
        if (chat.settings.autoDeleteEnabled && chat.settings.autoDeleteDuration) {
          const now = new Date();
          const cutoff = new Date(now.getTime() - chat.settings.autoDeleteDuration * 60 * 1000); // duration in minutes

          // Check if there are expired messages
          const expiredMessages = chat.messages.filter(m => {
            const mTime = m.timestamp instanceof Date ? m.timestamp : (m.timestamp as any).toDate();
            return mTime < cutoff;
          });

          if (expiredMessages.length > 0) {
            const activeMessages = chat.messages.filter(m => {
              const mTime = m.timestamp instanceof Date ? m.timestamp : (m.timestamp as any).toDate();
              return mTime >= cutoff;
            });
            // Update doc only if we are the admin or one of the participants (simple concurrency handling)
            // Ideally this is server side, but client side we just do it.
            try {
              await updateDoc(doc(db, 'chats', chat.id), { messages: activeMessages });
            } catch (e) { console.error("Auto delete error", e); }
          }
        }
      });
    }, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [chats, currentUser]);

  const playNotificationSound = useCallback((soundType: string = 'default') => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playNote = (freq: number, start: number, duration: number, vol: number = 0.1) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(vol, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    switch (soundType) {
      case 'soft': playNote(440, 0, 0.4, 0.05); break;
      case 'alert': playNote(880, 0, 0.1, 0.15); setTimeout(() => playNote(880, 0, 0.1, 0.15), 150); break;
      case 'melody':
        playNote(523.25, 0, 0.2);
        playNote(659.25, 0.15, 0.2);
        playNote(783.99, 0.3, 0.3);
        break;
      case 'default': default: playNote(880, 0, 0.5); break;
    }
  }, []);

  const handleLogin = async (name: string, pass: string) => {
    try {
      setLoginError('');
      const email = `${name.replace(/\s+/g, '')}@zchat.com`;

      // Force session persistence: User logged out if tab closes
      await setPersistence(auth, browserSessionPersistence);

      await signInWithEmailAndPassword(auth, email, pass);
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { status: 'online' });
      }
    } catch (error: any) {
      console.error("Login Error", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة');
      } else {
        setLoginError('حدث خطأ في تسجيل الدخول');
      }
    }
  };

  const handleRegister = async (name: string, pass: string) => {
    try {
      setLoginError('');
      const email = `${name.replace(/\s+/g, '')}@zchat.com`;
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      const uid = userCred.user.uid;
      const role: 'admin' | 'user' = name.toLowerCase() === 'admin' ? 'admin' : 'user';
      const newUser: User = {
        id: uid,
        name: name,
        password: pass,
        role: role,
        avatar: `https://picsum.photos/seed/${name}/200`,
        status: 'online',
      };
      await setDoc(doc(db, 'users', uid), newUser);

      if (role === 'user') {
        const admins = allUsers.filter(u => u.role === 'admin');
        for (const admin of admins) {
          const chatId = `chat_${admin.id}_${uid}`;
          await setDoc(doc(db, 'chats', chatId), {
            id: chatId,
            participantIds: [admin.id, uid],
            messages: [{
              id: `m_welcome_${uid}`,
              senderId: admin.id,
              text: 'مرحباً بك! يمكنك بدء المراسلة هنا.',
              timestamp: new Date(),
              status: MessageStatus.SENT,
              type: 'text'
            }],
            unreadCount: 0,
            settings: { ...DEFAULT_SETTINGS }
          });
        }
      }
    } catch (error: any) {
      console.error("Registration Error", error);
      setLoginError(error.message || 'فشل إنشاء الحساب');
    }
  };

  const handleLogout = async () => {
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { status: 'offline' });
      } catch (e) { console.error(e); }
      await signOut(auth);
    }
    setCurrentUser(null);
    setActiveChatId(null);
    setShowProfile(false);
  };

  const handleStartVideoCall = async () => {
    if (!activeChatId || !currentUser) return;
    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;

    const partner = activeChat.participants.find(p => p.id !== currentUser.id);
    if (!partner) return;

    const callDocRef = doc(collection(db, 'calls'));
    const callId = callDocRef.id;

    await setDoc(callDocRef, {
      callerId: currentUser.id,
      receiverId: partner.id,
      status: 'calling',
      timestamp: serverTimestamp()
    });

    setActiveCallData({
      id: callId,
      isCaller: true,
      participant: partner
    });
  };

  const handleAcceptCall = () => {
    if (!incomingCallData || !currentUser) return;
    setActiveCallData({
      id: incomingCallData.id,
      isCaller: false,
      participant: incomingCallData.participant
    });
    setIncomingCallData(null);
  };

  const handleRejectCall = async () => {
    if (!incomingCallData) return;
    await updateDoc(doc(db, 'calls', incomingCallData.id), { status: 'rejected' });
    setIncomingCallData(null);
  };

  const handleTyping = async (isTyping: boolean) => {
    if (!activeChatId || !currentUser) return;
    const chatRef = doc(db, 'chats', activeChatId);
    await updateDoc(chatRef, {
      [`typing.${currentUser.id}`]: isTyping
    });
  };

  const handleSendMessage = useCallback(async (text: string) => {
    if (!activeChatId || !currentUser) return;
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUser.id,
      text,
      timestamp: new Date(),
      status: MessageStatus.SENT,
      type: 'text',
      reactions: []
    };
    const chatRef = doc(db, 'chats', activeChatId);
    await updateDoc(chatRef, {
      messages: arrayUnion(newMessage)
    });

    if (text.includes("مساعد")) {
      const activeChat = chats.find(c => c.id === activeChatId);
      if (activeChat && activeChat.settings.soundEnabled) {
        playNotificationSound(activeChat.settings.selectedSound);
      }
    }
  }, [activeChatId, currentUser, playNotificationSound, chats]);

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    if (!activeChatId || !currentUser) return;
    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;

    const updatedMessages = activeChat.messages.map(m => {
      if (m.id === messageId) {
        const reactions = m.reactions || [];
        const existingReactionIndex = reactions.findIndex(r => r.emoji === emoji);

        let newReactions = [...reactions];

        if (existingReactionIndex > -1) {
          const reaction = newReactions[existingReactionIndex];
          const users = reaction.users || (reaction.me ? [currentUser.id] : []); // Fallback logic
          const userIndex = users.indexOf(currentUser.id);

          let newUsers = [...users];
          if (userIndex > -1) {
            newUsers.splice(userIndex, 1);
          } else {
            newUsers.push(currentUser.id);
          }

          if (newUsers.length === 0) {
            newReactions.splice(existingReactionIndex, 1);
          } else {
            newReactions[existingReactionIndex] = {
              ...reaction,
              users: newUsers,
              count: newUsers.length,
              me: newUsers.includes(currentUser.id)
            };
          }
        } else {
          newReactions.push({
            emoji,
            count: 1,
            me: true,
            users: [currentUser.id]
          });
        }
        return { ...m, reactions: newReactions };
      }
      return m;
    });

    await updateDoc(doc(db, 'chats', activeChatId), {
      messages: updatedMessages
    });
  };

  // Admin handlers
  const handleAddUser = async (newUserData: Partial<User>) => {
    // ... copied from previous context or simplified as strictly required ...
    // Re-implementing simplified version for clean file
    try {
      const name = newUserData.name || 'user';
      const email = `${name.replace(/\s+/g, '')}@zchat.com`;
      const password = newUserData.password || '123';

      const secondaryApp = initializeApp(firebaseConfig, "Secondary");
      const secondaryAuth = getAuth(secondaryApp);

      const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const uid = userCred.user.uid;

      const newUser: User = {
        id: uid,
        name: name,
        password: password,
        role: (newUserData.role as any) || 'user',
        avatar: newUserData.avatar || `https://picsum.photos/seed/${name}/200`,
        status: 'offline',
      };

      await setDoc(doc(db, 'users', uid), newUser);
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      const admins = allUsers.filter(u => u.role === 'admin');
      if (newUser.role === 'user') {
        for (const admin of admins) {
          const chatId = `chat_${admin.id}_${uid}`;
          await setDoc(doc(db, 'chats', chatId), {
            id: chatId,
            participantIds: [admin.id, uid],
            messages: [{ id: `m_welcome_${uid}`, senderId: admin.id, text: 'مرحباً بك! يمكنك بدء المراسلة هنا.', timestamp: new Date(), status: MessageStatus.SENT, type: 'text' }],
            unreadCount: 0,
            settings: { ...DEFAULT_SETTINGS }
          });
        }
      }
    } catch (error: any) {
      console.error("Error adding user:", error);
      alert("Error adding user: " + error.message);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try { await updateDoc(doc(db, 'users', userId), updates); } catch (e) { console.error(e); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === auth.currentUser?.uid) { alert('لا يمكن حذف نفسك!'); return; }
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) { await deleteDoc(doc(db, 'users', userId)); }
  };

  if (!authInitialized) {
    return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">جارٍ التحميل...</div>;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="flex h-[100dvh] bg-transparent text-slate-800 overflow-hidden relative">
      <div className={`${activeChatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 shrink-0`}>
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onChatSelect={setActiveChatId}
          onProfileClick={() => setShowProfile(true)}
          isAdmin={currentUser.role === 'admin'}
          onAdminClick={() => setShowAdminPanel(true)}
          currentUserId={currentUser.id}
          onLogout={handleLogout}
        />
      </div>

      <main className={`${activeChatId ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full bg-white/50 backdrop-blur-sm relative`}>
        {activeChat ? (
          <ChatWindow
            chat={activeChat}
            onSendMessage={handleSendMessage}
            onDeleteMessage={async (id) => {
              const newMessages = activeChat.messages.filter(m => m.id !== id);
              await updateDoc(doc(db, 'chats', activeChat.id), { messages: newMessages });
            }}
            onPinMessage={async (id) => {
              const newMessages = activeChat.messages.map(m => m.id === id ? { ...m, isPinned: !m.isPinned } : m);
              await updateDoc(doc(db, 'chats', activeChat.id), { messages: newMessages });
            }}
            onReactToMessage={handleReactToMessage}
            onUpdateSettings={async (settings) => {
              await updateDoc(doc(db, 'chats', activeChat.id), { settings: { ...activeChat.settings, ...settings } });
            }}
            onStartVideoCall={handleStartVideoCall}
            onBack={() => setActiveChatId(null)}
            onTyping={handleTyping}
            currentUserId={currentUser.id}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40 p-10 text-center">
            <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeWidth={1.5} /></svg>
            <p className="text-xl font-bold">Z-Chat Premium</p>
            <p className="mt-2 text-slate-400">اختر محادثة للبدء أو أضف مستخدماً جديداً إذا كنت مديراً</p>
          </div>
        )}
      </main>

      {/* Incoming Call Modal */}
      {incomingCallData && !activeCallData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-800 rounded-3xl p-8 max-w-sm w-full text-center border-2 border-teal-500/50 shadow-2xl animate-in zoom-in duration-300">
            <img src={incomingCallData.participant.avatar} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-teal-500 animate-bounce" alt="" />
            <h3 className="text-2xl font-bold text-white mb-1">{incomingCallData.participant.name}</h3>
            <p className="text-slate-400 mb-8">يتصل بك فيديو...</p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRejectCall}
                className="p-4 bg-red-600 hover:bg-red-500 rounded-full text-white transition-transform hover:scale-110"
              >
                <svg className="w-8 h-8 rotate-[135deg]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
              </button>
              <button
                onClick={handleAcceptCall}
                className="p-4 bg-green-500 hover:bg-green-400 rounded-full text-white transition-transform hover:scale-110 animate-pulse"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeEffect && <ReactionOverlay emoji={activeEffect} />}

      {activeCallData && (
        <VideoCall
          participant={activeCallData.participant}
          currentUser={currentUser}
          callId={activeCallData.id}
          isCaller={activeCallData.isCaller}
          onClose={() => setActiveCallData(null)}
        />
      )}

      {showProfile && <ProfileSettings user={currentUser} onClose={() => setShowProfile(false)} onLogout={handleLogout} />}
      {showAdminPanel && (
        <AdminPanel
          users={allUsers}
          onAddUser={handleAddUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
    </div>
  );
};

export default App;
