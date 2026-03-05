import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, useData } from '../context';
import { uploadHomeworkFile } from '../firebase';
import {
  MessageCircle, Send, Paperclip, X, File, Download, ChevronLeft,
  Search, Check, CheckCheck, User, Users
} from 'lucide-react';
import type { ChatMessage, ChatAttachment, User as UserType, Student } from '../data';

interface ChatProps {
  currentUserRole?: 'student' | 'admin';
}

export const Chat: React.FC<ChatProps> = ({ currentUserRole }) => {
  const { user } = useAuth();
  const { chatMessages, setChatMessages, students } = useData();
  
  // Используем переданный role или определяем из user
  const currentUser = user ? {
    ...user,
    role: currentUserRole || (user.role || 'student')
  } : null;
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; role: 'student' | 'admin' } | null>(null);
  const [showUserList, setShowUserList] = useState(false);

  // Для админа - получить список всех учеников
  const allUsers = useMemo(() => {
    const users: { id: string; name: string; role: 'student' | 'admin' }[] = [];
    
    // Добавляем всех учеников
    students.forEach((s: Student) => {
      users.push({
        id: s.id,
        name: `${s.lastName} ${s.firstName}`,
        role: 'student'
      });
    });

    // Если текущий пользователь админ, добавляем его в список для получения сообщений от других админов (если есть)
    // Но для нашей системы, учитель - единственный админ
    
    return users;
  }, [students]);

  // Получаем список диалогов (пользователей, с которыми есть сообщения)
  const dialogs = useMemo(() => {
    const dialogMap = new Map<string, { id: string; name: string; role: 'student' | 'admin'; lastMessage?: ChatMessage; unread: number }>();
    
    chatMessages.forEach(msg => {
      const otherUserId = currentUser?.role === 'admin' 
        ? msg.senderId === currentUser.id ? msg.receiverId : msg.senderId
        : msg.senderId === currentUser?.id ? msg.receiverId : msg.senderId;
      
      const otherUserName = currentUser?.role === 'admin'
        ? msg.senderId === currentUser.id ? msg.receiverName : msg.senderName
        : msg.senderId === currentUser?.id ? msg.receiverName : msg.senderName;

      const otherUserRole = currentUser?.role === 'admin'
        ? msg.senderId === currentUser.id ? 'student' : msg.senderRole
        : msg.senderId === currentUser?.id ? 'admin' : msg.senderRole;

      if (!dialogMap.has(otherUserId)) {
        dialogMap.set(otherUserId, { id: otherUserId, name: otherUserName, role: otherUserRole });
      }
      
      // Обновляем последнее сообщение и счётчик непрочитанных
      const existing = dialogMap.get(otherUserId)!;
      const isUnread = currentUser?.role === 'admin' 
        ? msg.receiverId === currentUser.id && !msg.read
        : msg.receiverId === currentUser?.id && !msg.read;
      
      if (!existing.lastMessage || new Date(msg.timestamp) > new Date(existing.lastMessage.timestamp)) {
        existing.lastMessage = msg;
      }
      if (isUnread) {
        existing.unread = (existing.unread || 0) + 1;
      }
    });

    // Добавляем всех учеников для админа, даже если нет сообщений
    if (currentUser?.role === 'admin') {
      students.forEach((s: Student) => {
        if (!dialogMap.has(s.id)) {
          dialogMap.set(s.id, { id: s.id, name: `${s.lastName} ${s.firstName}`, role: 'student' });
        }
      });
    }

    return Array.from(dialogMap.values()).sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [chatMessages, currentUser, students]);

  // Выбрать первого пользователя если не выбран
  useEffect(() => {
    if (!selectedUser && dialogs.length > 0) {
      setSelectedUser(dialogs[0]);
    }
  }, [dialogs, selectedUser]);

  return (
    <div className="h-[calc(100vh-180px)] flex gap-4">
      {/* Список диалогов */}
      <div className={`${showUserList ? 'flex' : 'hidden'} md:flex w-full md:w-80 flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden`}>
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Сообщения
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {dialogs.map(dialog => (
            <button
              key={dialog.id}
              onClick={() => {
                setSelectedUser(dialog);
                setShowUserList(false);
              }}
              className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                selectedUser?.id === dialog.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
                {dialog.role === 'admin' ? <User className="w-6 h-6" /> : dialog.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 truncate">{dialog.name}</span>
                  {dialog.lastMessage && (
                    <span className="text-xs text-gray-400">
                      {formatMessageTime(dialog.lastMessage.timestamp)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 truncate">
                    {dialog.lastMessage?.content || 'Нет сообщений'}
                  </span>
                  {dialog.unread && dialog.unread > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                      {dialog.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
          
          {dialogs.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Нет диалогов</p>
            </div>
          )}
        </div>
      </div>

      {/* Окно чата */}
      <div className={`flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${!showUserList ? 'flex' : 'hidden md:flex'}`}>
        {selectedUser ? (
          <ChatWindow
            currentUser={currentUser}
            otherUser={selectedUser}
            messages={chatMessages}
            onSendMessage={(content, attachments) => {
              const newMessage: ChatMessage = {
                id: `msg${Date.now()}`,
                senderId: currentUser!.id,
                senderName: currentUser!.name,
                senderRole: currentUser!.role as 'student' | 'admin',
                receiverId: selectedUser.id,
                receiverName: selectedUser.name,
                content,
                timestamp: new Date().toISOString(),
                attachments,
                read: false
              };
              setChatMessages(prev => [...prev, newMessage]);
            }}
            onMarkAsRead={() => {
              setChatMessages(prev => prev.map(msg => {
                if (msg.receiverId === currentUser?.id && msg.senderId === selectedUser.id && !msg.read) {
                  return { ...msg, read: true };
                }
                return msg;
              }));
            }}
            onBack={() => setShowUserList(true)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Выберите диалог</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== CHAT WINDOW ====================
interface ChatWindowProps {
  currentUser: UserType | null;
  otherUser: { id: string; name: string; role: 'student' | 'admin' };
  messages: ChatMessage[];
  onSendMessage: (content: string, attachments?: ChatAttachment[]) => void;
  onMarkAsRead: () => void;
  onBack: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  currentUser,
  otherUser,
  messages,
  onSendMessage,
  onMarkAsRead,
  onBack
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Фильтруем сообщения для текущего диалога
  const dialogMessages = useMemo(() => {
    return messages.filter(msg =>
      (msg.senderId === currentUser?.id && msg.receiverId === otherUser.id) ||
      (msg.senderId === otherUser.id && msg.receiverId === currentUser?.id)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, currentUser, otherUser]);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dialogMessages]);

  // Отметить как прочитанные
  useEffect(() => {
    onMarkAsRead();
  }, [dialogMessages.length, onMarkAsRead]);

  const handleSend = () => {
    if (!message.trim() && attachments.length === 0) return;
    onSendMessage(message.trim(), attachments.length > 0 ? attachments : undefined);
    setMessage('');
    setAttachments([]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const result = await uploadHomeworkFile(file);
        setAttachments(prev => [...prev, {
          id: `att${Date.now()}${Math.random()}`,
          name: result.name,
          url: result.url,
          type: file.type,
          size: file.size
        }]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка загрузки файла');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Заголовок */}
      <div className="p-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={onBack} className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
          {otherUser.role === 'admin' ? <User className="w-5 h-5" /> : otherUser.name.charAt(0)}
        </div>
        <div>
          <div className="font-semibold text-gray-900">{otherUser.name}</div>
          <div className="text-xs text-gray-500">{otherUser.role === 'admin' ? 'Учитель' : 'Ученик'}</div>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {dialogMessages.map(msg => {
          const isOwn = msg.senderId === currentUser?.id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                <div className={`px-4 py-3 rounded-2xl ${
                  isOwn 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-md' 
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  
                  {/* Вложения */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className={`mt-3 space-y-2 ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
                      {msg.attachments.map(att => (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 p-2 rounded-lg ${
                            isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-white hover:bg-gray-50'
                          } transition-colors`}
                        >
                          <File className="w-4 h-4" />
                          <span className="text-sm truncate max-w-[150px]">{att.name}</span>
                          <Download className="w-4 h-4" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${isOwn ? 'justify-end' : ''}`}>
                  <span>{formatMessageTime(msg.timestamp)}</span>
                  {isOwn && (
                    msg.read ? <CheckCheck className="w-3.5 h-3.5 text-blue-500" /> : <Check className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Вложения */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 flex flex-wrap gap-2">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl">
              <File className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 max-w-[120px] truncate">{att.name}</span>
              <button onClick={() => removeAttachment(att.id)} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Ввод сообщения */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5 text-gray-600" />
            )}
          </button>
          <div className="flex-1">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите сообщение..."
              rows={1}
              className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!message.trim() && attachments.length === 0}
            className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
};

// ==================== HELPERS ====================
function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const dayDiff = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } else if (dayDiff === 1) {
    return 'Вчера';
  } else if (dayDiff < 7) {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }
}
