
export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ'
}

export interface Reaction {
  emoji: string;
  count: number;
  me: boolean;
}

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'typing';
  lastSeen?: string;
  role: UserRole;
  password?: string; // For mock authentication
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: MessageStatus;
  isPinned?: boolean;
  type: 'text' | 'image' | 'voice';
  reactions?: Reaction[];
}

export interface ChatSettings {
  soundEnabled: boolean;
  autoDeleteEnabled: boolean;
  selectedSound: 'default' | 'soft' | 'alert' | 'melody';
}

export interface Chat {
  id: string;
  participants: User[];
  messages: Message[];
  unreadCount: number;
  settings: ChatSettings;
  typing?: Record<string, boolean>;
}

export interface AppState {
  currentUser: User | null;
  chats: Chat[];
  activeChatId: string | null;
  isVideoCalling: boolean;
  isLoggedIn: boolean;
}
