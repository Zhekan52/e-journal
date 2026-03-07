import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, useData } from '../context';
import { uploadHomeworkFile } from '../firebase';
import {
  MessageCircle, Send, Paperclip, Download, X, Check, CheckCheck,
  User, Search, File, Image, FileText, Archive, ZoomIn, Trash2
} from 'lucide-react';
import type { ChatMessage } from '../data';

// ==================== LIGHTBOX COMPONENT ====================
const ImageLightbox: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>
      <img 
        src={src} 
        alt="Просмотр изображения" 
        className="max-w-full max-h-full object-contain animate-scaleIn"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
};

// ==================== HELPER FUNCTIONS ====================
const isImageFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
};

// ==================== STUDENT CHAT WIDGET ====================
export const StudentChatWidget: React.FC = () => {
  const { user } = useAuth();
  const { chatMessages, setChatMessages } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canDeleteMessage = (msg: ChatMessage) => {
    // Студент может удалять только свои сообщения
    return msg.fromUserId === studentId;
  };

  const deleteMessage = (msgId: string) => {
    if (!confirm('Удалить это сообщение?')) return;
    setChatMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const studentId = user?.id || '';
  
  const myMessages = useMemo(() => {
    return chatMessages
      .filter(m => m.fromUserId === studentId || m.toUserId === studentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [chatMessages, studentId]);

  const unreadCount = useMemo(() => {
    return myMessages.filter(m => m.toUserId === studentId && !m.read).length;
  }, [myMessages, studentId]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      const toMarkAsRead = myMessages.filter(m => m.toUserId === studentId && !m.read);
      if (toMarkAsRead.length > 0) {
        setChatMessages(prev => 
          prev.map(m => 
            m.toUserId === studentId && !m.read ? { ...m, read: true } : m
          )
        );
      }
    }
  }, [isOpen, myMessages, studentId, setChatMessages]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    
    setSending(true);
    const newMessage: ChatMessage = {
      id: `msg${Date.now()}`,
      fromUserId: studentId,
      fromUserName: user?.name || 'Ученик',
      fromUserRole: 'student',
      toUserId: 'admin',
      text: text.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };

    setChatMessages(prev => [...prev, newMessage]);
    setText('');
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploading) return;

    setUploading(true);
    try {
      const result = await uploadHomeworkFile(file);
      const newMessage: ChatMessage = {
        id: `msg${Date.now()}`,
        fromUserId: studentId,
        fromUserName: user?.name || 'Ученик',
        fromUserRole: 'student',
        toUserId: 'admin',
        text: '',
        attachment: { name: result.name, url: result.url },
        createdAt: new Date().toISOString(),
        read: false,
      };
      setChatMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка при загрузке файла');
    }
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';
    myMessages.forEach(msg => {
      const msgDate = formatDate(msg.createdAt);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    return groups;
  }, [myMessages]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center hover:scale-110 transition-transform z-40"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && createPortal(
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-50 animate-scaleIn">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Чат с учителем</h3>
              <p className="text-xs text-blue-100">Задавайте вопросы и отправляйте файлы</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {groupedMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageCircle className="w-12 h-12 mb-2" />
                <p className="text-sm">Нет сообщений</p>
                <p className="text-xs mt-1">Напишите учителю!</p>
              </div>
            ) : (
              groupedMessages.map(group => (
                <div key={group.date}>
                  <div className="text-center text-xs text-gray-400 my-3">
                    <span className="bg-white px-3 py-1 rounded-full shadow-sm">{group.date}</span>
                  </div>
                      {group.messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.fromUserId === studentId ? 'justify-end' : 'justify-start'} mb-2`}
                          onMouseEnter={() => setHoveredMessageId(msg.id)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                        >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          msg.fromUserId === studentId
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-md'
                            : 'bg-white text-gray-900 shadow-sm rounded-bl-md'
                        }`}
                      >
                        {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                        {msg.attachment && (
                          isImageFile(msg.attachment.name) ? (
                            <div 
                              className="mt-1 cursor-pointer group relative"
                              onClick={() => setLightboxImage(msg.attachment!.url)}
                            >
                              <div className="relative overflow-hidden rounded-lg">
                                <img 
                                  src={msg.attachment.url} 
                                  alt={msg.attachment.name}
                                  className="max-w-[200px] max-h-[200px] object-cover rounded-lg transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <a
                              href={msg.attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 p-2 rounded-lg mt-1 ${
                                msg.fromUserId === studentId ? 'bg-white/20' : 'bg-gray-100'
                              }`}
                            >
                              <File className="w-4 h-4" />
                              <span className="text-sm truncate max-w-[150px]">{msg.attachment.name}</span>
                              <Download className="w-4 h-4 ml-auto" />
                            </a>
                          )
                        )}
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          msg.fromUserId === studentId ? 'text-blue-100' : 'text-gray-400'
                        }`}>
                          {canDeleteMessage(msg) && hoveredMessageId === msg.id && (
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="p-1 hover:bg-red-500/20 rounded transition-colors"
                              title="Удалить сообщение"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                          <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                          {msg.fromUserId === studentId && (
                            msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Написать сообщение..."
                className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim() || sending}
                className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {lightboxImage && createPortal(
        <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />,
        document.body
      )}
    </>
  );
};

// ==================== ADMIN CHAT VIEW ====================
export const AdminChatView: React.FC = () => {
  const { user } = useAuth();
  const { chatMessages, setChatMessages, students } = useData();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canDeleteMessage = (msg: ChatMessage) => {
    // Админ может удалять любые сообщения
    return user?.role === 'admin';
  };

  const deleteMessage = (msgId: string) => {
    if (!confirm('Удалить это сообщение?')) return;
    setChatMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const allStudents = useMemo(() => {
    return [...students].sort((a, b) => a.lastName.localeCompare(b.lastName, 'ru'));
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return allStudents;
    const query = searchQuery.toLowerCase();
    return allStudents.filter(s => 
      `${s.lastName} ${s.firstName}`.toLowerCase().includes(query)
    );
  }, [allStudents, searchQuery]);

  const currentMessages = useMemo(() => {
    if (!selectedStudentId) return [];
    return chatMessages
      .filter(m => m.fromUserId === selectedStudentId || m.toUserId === selectedStudentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [chatMessages, selectedStudentId]);

  const unreadByStudent = useMemo(() => {
    const map: Record<string, number> = {};
    chatMessages.forEach(m => {
      if (m.toUserId === 'admin' && m.fromUserRole === 'student' && !m.read) {
        map[m.fromUserId] = (map[m.fromUserId] || 0) + 1;
      }
    });
    return map;
  }, [chatMessages]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  useEffect(() => {
    if (selectedStudentId) {
      setChatMessages(prev =>
        prev.map(m =>
          m.fromUserId === selectedStudentId && !m.read ? { ...m, read: true } : m
        )
      );
    }
  }, [selectedStudentId, setChatMessages]);

  const sendMessage = async () => {
    if (!text.trim() || !selectedStudentId || sending) return;

    setSending(true);
    const newMessage: ChatMessage = {
      id: `msg${Date.now()}`,
      fromUserId: 'admin',
      fromUserName: user?.name || 'Учитель',
      fromUserRole: 'admin',
      toUserId: selectedStudentId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };

    setChatMessages(prev => [...prev, newMessage]);
    setText('');
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudentId || uploading) return;

    setUploading(true);
    try {
      const result = await uploadHomeworkFile(file);
      const newMessage: ChatMessage = {
        id: `msg${Date.now()}`,
        fromUserId: 'admin',
        fromUserName: user?.name || 'Учитель',
        fromUserRole: 'admin',
        toUserId: selectedStudentId,
        text: '',
        attachment: { name: result.name, url: result.url },
        createdAt: new Date().toISOString(),
        read: false,
      };
      setChatMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка при загрузке файла');
    }
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';
    currentMessages.forEach(msg => {
      const msgDate = formatDate(msg.createdAt);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    return groups;
  }, [currentMessages]);

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <Image className="w-4 h-4" />;
    if (['pdf'].includes(ext || '')) return <FileText className="w-4 h-4" />;
    if (['zip', 'rar', '7z'].includes(ext || '')) return <Archive className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="animate-fadeIn h-[calc(100vh-180px)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Чат с учениками</h2>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden h-full flex">
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск ученика..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <User className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Нет учеников</p>
              </div>
            ) : (
              filteredStudents.map(student => {
                const isSelected = selectedStudentId === student.id;
                const unread = unreadByStudent[student.id] || 0;
                const lastMsg = chatMessages
                  .filter(m => m.fromUserId === student.id || m.toUserId === student.id)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`w-full p-3 flex items-center gap-3 text-left transition-colors ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                      {student.lastName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 truncate">
                          {student.lastName} {student.firstName}
                        </span>
                        {unread > 0 && (
                          <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {unread}
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {lastMsg.text || (lastMsg.attachment ? 'Файл' : '')}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedStudentId ? (
            <>
              <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                  {selectedStudent?.lastName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedStudent?.lastName} {selectedStudent?.firstName}
                  </h3>
                  <p className="text-xs text-gray-500">Ученик</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {groupedMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageCircle className="w-12 h-12 mb-2" />
                    <p className="text-sm">Начните диалог</p>
                    <p className="text-xs mt-1">Напишите сообщение ученику</p>
                  </div>
                ) : (
                  groupedMessages.map(group => (
                    <div key={group.date}>
                      <div className="text-center text-xs text-gray-400 my-3">
                        <span className="bg-white px-3 py-1 rounded-full shadow-sm">{group.date}</span>
                      </div>
                      {group.messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.fromUserRole === 'admin' ? 'justify-end' : 'justify-start'} mb-2`}
                          onMouseEnter={() => setHoveredMessageId(msg.id)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              msg.fromUserRole === 'admin'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-md'
                                : 'bg-white text-gray-900 shadow-sm rounded-bl-md'
                            }`}
                          >
                            {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                            {msg.attachment && (
                              isImageFile(msg.attachment.name) ? (
                                <div 
                                  className="mt-1 cursor-pointer group relative"
                                  onClick={() => setLightboxImage(msg.attachment!.url)}
                                >
                                  <div className="relative overflow-hidden rounded-lg">
                                    <img 
                                      src={msg.attachment.url} 
                                      alt={msg.attachment.name}
                                      className="max-w-[200px] max-h-[200px] object-cover rounded-lg transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <a
                                  href={msg.attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 p-2 rounded-lg mt-1 ${
                                    msg.fromUserRole === 'admin' ? 'bg-white/20' : 'bg-gray-100'
                                  }`}
                                >
                                  {getFileIcon(msg.attachment.name)}
                                  <span className="text-sm truncate max-w-[200px]">{msg.attachment.name}</span>
                                  <Download className="w-4 h-4 ml-auto flex-shrink-0" />
                                </a>
                              )
                            )}
                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                              msg.fromUserRole === 'admin' ? 'text-blue-100' : 'text-gray-400'
                            }`}>
                              {canDeleteMessage(msg) && hoveredMessageId === msg.id && (
                                <button
                                  onClick={() => deleteMessage(msg.id)}
                                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                  title="Удалить сообщение"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                              <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                              {msg.fromUserRole === 'admin' && (
                                msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 bg-white border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Написать сообщение..."
                    className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!text.trim() || sending}
                    className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageCircle className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">Выберите ученика</p>
              <p className="text-sm mt-1">для начала диалога</p>
            </div>
          )}
        </div>
      </div>
      {lightboxImage && (
        <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
    </div>
  );
};
