import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, useData } from '../context';
import { Schedule } from './Schedule';
import { QuestionEditor } from './QuestionEditor';
import { Reports } from './Reports';
import { FipiTrainer } from './FipiTrainer';
import { Chat } from './Chat';
import { uploadHomeworkFile } from '../firebase';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  BookOpen, Calendar, ClipboardList, Users, LogOut, Settings, Plus,
  Trash2, Edit2, Search, X, Save, ChevronDown, ChevronLeft, Eye, EyeOff,
  AlertTriangle, TrendingUp, TrendingDown, FileText,
  BarChart3, Award, ArrowLeft, RefreshCw, ChevronRight, Tag, Info,
  Paperclip, Download, Keyboard, MousePointer2, PanelLeftClose, PanelLeft,
  CalendarDays, FileBarChart, Brain, Clock, MessageCircle
} from 'lucide-react';
import {
  SUBJECTS, MONTH_NAMES, MONTH_NAMES_GEN, ATTENDANCE_TYPES,
  type Student, type Test, type TestQuestion, type CustomLessonType, type AttendanceRecord,
  formatDate, getTodayString, getTodayDate
} from '../data';

type Tab = 'dashboard' | 'schedule' | 'journal' | 'attendance' | 'tests' | 'students' | 'lessonTypes' | 'reports' | 'fipi' | 'chat';

// ==================== GRADE WITH TOOLTIP ====================
interface GradeWithTooltipProps {
  value: number;
  testTitle?: string;
}

const GradeWithTooltip: React.FC<GradeWithTooltipProps> = ({ value, testTitle }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const colorClass = value === 5 
    ? 'bg-green-100 text-green-700' 
    : value === 4 
      ? 'bg-blue-100 text-blue-700' 
      : value === 3 
        ? 'bg-yellow-100 text-yellow-700' 
        : 'bg-red-100 text-red-700';

  const tooltipText = testTitle ? `Тест: ${testTitle}` : '';

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top,
        left: rect.left + rect.width / 2
      });
    }
    setShowTooltip(true);
  };

  // Вычисляем позицию тултипа с учётом границ экрана
  const getTooltipStyle = () => {
    if (!tooltipPos) return {};
    const tooltipWidth = testTitle ? Math.min(300, testTitle.length * 8 + 40) : 150;
    const padding = 10;
    let left = tooltipPos.left;
    
    // Корректируем позицию, чтобы тултип не выходил за границы экрана
    if (left - tooltipWidth / 2 < padding) {
      left = padding + tooltipWidth / 2;
    } else if (left + tooltipWidth / 2 > window.innerWidth - padding) {
      left = window.innerWidth - padding - tooltipWidth / 2;
    }
    
    return {
      top: tooltipPos.top - 8,
      left: left,
      transform: 'translate(-50%, -100%)',
    };
  };

  return (
    <div className="relative inline-flex">
      <button 
        ref={triggerRef}
        className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${colorClass}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {value}
      </button>
      {showTooltip && tooltipText && tooltipPos && createPortal(
        <div 
          className="fixed z-[100] px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none"
          style={{ 
            ...getTooltipStyle(),
            whiteSpace: 'normal',
            maxWidth: '300px'
          }}
        >
          {tooltipText}
          <div 
            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" 
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export const AdminView: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [scheduleEditMode, setScheduleEditMode] = useState(false);
  const [lessonPageParams, setLessonPageParams] = useState<{ subject: string; date: string; lessonNumber: number } | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Сводка', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'schedule', label: 'Расписание', icon: <Calendar className="w-5 h-5" /> },
    { id: 'journal', label: 'Журнал', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'attendance', label: 'Посещаемость', icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'tests', label: 'Тесты', icon: <FileText className="w-5 h-5" /> },
    { id: 'students', label: 'Ученики', icon: <Users className="w-5 h-5" /> },
    { id: 'lessonTypes', label: 'Типы уроков', icon: <Tag className="w-5 h-5" /> },
    { id: 'reports', label: 'Отчёты', icon: <FileBarChart className="w-5 h-5" /> },
    { id: 'fipi', label: 'ФИПИ тренажёр', icon: <Brain className="w-5 h-5" /> },
    { id: 'chat', label: 'Чат', icon: <MessageCircle className="w-5 h-5" /> },
  ];

  const handleOpenLessonPage = (subject: string, date: string, lessonNumber: number) => {
    // Сохраняем параметры в localStorage для использования в компоненте Journal
    localStorage.setItem('open_journal_params', JSON.stringify({ subject, date, lessonNumber }));
    // Переключаемся на вкладку Журнал
    setActiveTab('journal');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Modern Design */}
      <aside className={`fixed left-0 top-0 h-full bg-white/95 backdrop-blur-xl border-r-0 z-40 flex flex-col transition-all duration-300 shadow-2xl ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-gray-100/50">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-gray-900 text-sm block leading-tight">Электронный</span>
                <span className="font-bold text-gray-900 text-sm block leading-tight">журнал</span>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}>
              <span className={activeTab === tab.id ? 'text-white' : 'text-gray-400'}>{tab.icon}</span>
              {!sidebarCollapsed && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-gray-100/50">
          {!sidebarCollapsed ? (
            <button onClick={() => setShowSettingsModal(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-100 transition-colors group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                {user?.name?.charAt(0)}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-bold text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-500 font-medium">Администратор</div>
              </div>
            </button>
          ) : (
            <button onClick={() => setShowSettingsModal(true)} className="w-full flex items-center justify-center p-2 rounded-2xl hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                {user?.name?.charAt(0)}
              </div>
            </button>
          )}
          <button onClick={logout} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors mt-1 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm font-semibold">Выход</span>}
          </button>
        </div>

        {/* Collapse button */}
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-24 w-7 h-7 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 hover:scale-110 transition-all"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </aside>

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <header className="bg-white/80 backdrop-blur-2xl border-b border-gray-200/30 sticky top-0 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                <span className="font-bold text-gray-900 text-xl tracking-tight">{tabs.find(t => t.id === activeTab)?.label}</span>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setShowSettingsModal(true)} className="sm:hidden flex items-center gap-2 px-3 py-2 bg-gray-100/50 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                    {user?.name?.charAt(0)}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'schedule' && <Schedule editable={scheduleEditMode} onEditModeChange={setScheduleEditMode} onOpenLessonPage={handleOpenLessonPage} />}
        {activeTab === 'journal' && <Journal />}
        {activeTab === 'attendance' && <AttendanceCalendar />}
        {activeTab === 'tests' && <TestsManager />}
        {activeTab === 'students' && <StudentsManager />}
        {activeTab === 'lessonTypes' && <LessonTypesManager />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'fipi' && <FipiTrainer />}
        {activeTab === 'chat' && <Chat currentUserRole="admin" />}
        </div>
      </main>
        
      {/* Settings Modal */}
      {showSettingsModal && (
        <AdminSettingsModal user={user} onClose={() => setShowSettingsModal(false)} onSave={updateUser} />
      )}
    </div>
  );
};

// ==================== ADMIN SETTINGS MODAL ====================
const AdminSettingsModal: React.FC<{
  user: User | null;
  onClose: () => void;
  onSave: (username: string, password: string) => void;
}> = ({ user, onClose, onSave }) => {
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState(user?.password || '');
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = () => {
    if (!username.trim() || !password.trim()) {
      alert('Заполните все поля');
      return;
    }
    onSave(username.trim(), password.trim());
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl w-full max-w-md p-7 space-y-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Настройки администратора</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Логин</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              placeholder="Введите логин"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 pt-2">
          <button 
            onClick={onClose}
            className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            Отмена
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 font-medium"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ==================== LESSON TYPES MANAGER ====================
const LessonTypesManager: React.FC = () => {
  const { customLessonTypes, setCustomLessonTypes } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<CustomLessonType | null>(null);
  const [formData, setFormData] = useState({ label: '', short: '', color: 'bg-blue-100 text-blue-700' });

  const colorOptions = [
    { value: 'bg-blue-100 text-blue-700', label: 'Синий', preview: 'bg-blue-100 text-blue-700' },
    { value: 'bg-green-100 text-green-700', label: 'Зелёный', preview: 'bg-green-100 text-green-700' },
    { value: 'bg-red-100 text-red-700', label: 'Красный', preview: 'bg-red-100 text-red-700' },
    { value: 'bg-amber-100 text-amber-700', label: 'Жёлтый', preview: 'bg-amber-100 text-amber-700' },
    { value: 'bg-purple-100 text-purple-700', label: 'Фиолетовый', preview: 'bg-purple-100 text-purple-700' },
    { value: 'bg-pink-100 text-pink-700', label: 'Розовый', preview: 'bg-pink-100 text-pink-700' },
    { value: 'bg-teal-100 text-teal-700', label: 'Бирюзовый', preview: 'bg-teal-100 text-teal-700' },
    { value: 'bg-orange-100 text-orange-700', label: 'Оранжевый', preview: 'bg-orange-100 text-orange-700' },
    { value: 'bg-cyan-100 text-cyan-700', label: 'Голубой', preview: 'bg-cyan-100 text-cyan-700' },
    { value: 'bg-rose-100 text-rose-700', label: 'Розовый тёмный', preview: 'bg-rose-100 text-rose-700' },
  ];

  const generateValue = (label: string) => {
    return label.toLowerCase()
      .replace(/[^а-яёa-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 20) || 'custom';
  };

  const openAdd = () => {
    setEditingType(null);
    setFormData({ label: '', short: '', color: 'bg-blue-100 text-blue-700' });
    setShowModal(true);
  };

  const openEdit = (type: CustomLessonType) => {
    setEditingType(type);
    setFormData({ label: type.label, short: type.short, color: type.color });
    setShowModal(true);
  };

  const save = () => {
    if (!formData.label || !formData.short) {
      alert('Заполните все поля');
      return;
    }
    const value = generateValue(formData.label);
    if (editingType) {
      setCustomLessonTypes(prev => prev.map(t => t.id === editingType.id ? { ...t, ...formData, value } : t));
    } else {
      setCustomLessonTypes(prev => [...prev, { id: `clt${Date.now()}`, value, ...formData }]);
    }
    setShowModal(false);
  };

  const deleteType = (id: string) => {
    if (confirm('Удалить этот тип урока?')) {
      setCustomLessonTypes(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Типы уроков</h2>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 font-medium">
          <Plus className="w-5 h-5" /> Добавить тип
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg">
        {customLessonTypes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 font-medium">Нет пользовательских типов уроков</p>
            <p className="text-gray-300 text-sm mt-1">Создайте свой тип урока для использования в журнале</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customLessonTypes.map(type => (
              <div key={type.id} className="p-5 rounded-xl bg-gray-50/50 border border-white/50 hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${type.color}`}>
                    {type.short}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(type)} className="p-1.5 rounded-lg hover:bg-white transition-colors">
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => deleteType(type.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <h3 className="font-medium text-gray-900">{type.label}</h3>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl w-full max-w-md p-7 space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingType ? 'Редактировать тип урока' : 'Добавить тип урока'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название</label>
                <input type="text" value={formData.label} onChange={e => setFormData(p => ({ ...p, label: e.target.value }))}
                  placeholder="Например: Проектная работа"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Сокращение</label>
                <input type="text" value={formData.short} onChange={e => setFormData(p => ({ ...p, short: e.target.value }))}
                  placeholder="Пр"
                  maxLength={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цвет</label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map(opt => (
                    <button key={opt.value} onClick={() => setFormData(p => ({ ...p, color: opt.value }))}
                      className={`p-3 rounded-xl border-2 transition-all ${formData.color === opt.value ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className={`w-full h-8 rounded-lg ${opt.preview.split(' ')[0]}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium">
                Отмена
              </button>
              <button onClick={save}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 font-medium">
                Сохранить
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ==================== DASHBOARD ====================
const AdminDashboard: React.FC = () => {
  const { students, grades, lessons, tests, attendance } = useData();
  const today = getTodayString();
  const todayLessons = lessons.filter(l => l.date === today).sort((a, b) => a.lessonNumber - b.lessonNumber);

  const existingStudentIds = new Set(students.map(s => s.id));
  // Фильтруем оценки: только для существующих учеников и учитываемые в среднем балле
  const filteredGrades = grades.filter(g => existingStudentIds.has(g.studentId) && !g.excludeFromAverage);
  const avgGrade = filteredGrades.length > 0 ? (filteredGrades.reduce((s, g) => s + g.value, 0) / filteredGrades.length).toFixed(2) : '—';
  const absentCount = attendance.filter(a => a.type === 'Н' && existingStudentIds.has(a.studentId)).length;

  const topStudents = useMemo(() => {
    return students.map(s => {
      const sg = filteredGrades.filter(g => g.studentId === s.id);
      const avg = sg.length > 0 ? sg.reduce((a, g) => a + g.value, 0) / sg.length : 0;
      return { ...s, avg, count: sg.length };
    }).filter(s => s.count > 0).sort((a, b) => b.avg - a.avg).slice(0, 5);
  }, [students, filteredGrades]);

  const weakStudents = useMemo(() => {
    return students.map(s => {
      const sg = filteredGrades.filter(g => g.studentId === s.id);
      const avg = sg.length > 0 ? sg.reduce((a, g) => a + g.value, 0) / sg.length : 0;
      return { ...s, avg, count: sg.length };
    }).filter(s => s.count > 0).sort((a, b) => a.avg - b.avg).slice(0, 5);
  }, [students, filteredGrades]);

  const avgBySubject = useMemo(() => {
    return SUBJECTS.map(s => {
      const sg = filteredGrades.filter(g => g.subject === s);
      const avg = sg.length > 0 ? sg.reduce((a, g) => a + g.value, 0) / sg.length : 0;
      return { subject: s, avg, count: sg.length };
    }).filter(s => s.count > 0);
  }, [filteredGrades]);

  const distribution = useMemo(() => {
    const d = { 5: 0, 4: 0, 3: 0, 2: 0 };
    filteredGrades.forEach(g => { d[g.value as keyof typeof d] = (d[g.value as keyof typeof d] || 0) + 1; });
    return d;
  }, [filteredGrades]);

  const totalGrades = filteredGrades.length;

  return (
    <div className="animate-fadeIn space-y-8">
      {/* Welcome Banner - Modern Style */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold mb-3">Добро пожаловать!</h1>
          <p className="text-blue-100 text-lg font-medium">
            {getTodayDate().getDate()} {MONTH_NAMES_GEN[getTodayDate().getMonth()]} · {students.length} учеников · {todayLessons.length} уроков сегодня
          </p>
        </div>
      </div>

      {/* Stats Cards - Modern Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-3xl p-6 shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-500">Учеников</span>
          </div>
          <div className="text-4xl font-bold text-gray-900">{students.length}</div>
        </div>
        <div className="glass rounded-3xl p-6 shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Award className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-500">Средний балл</span>
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{avgGrade}</div>
        </div>
        <div className="glass rounded-3xl p-6 shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-500">Оценок</span>
          </div>
          <div className="text-4xl font-bold text-gray-900">{filteredGrades.length}</div>
        </div>
        <div className="glass rounded-3xl p-6 shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-500">Пропуски (Н)</span>
          </div>
          <div className="text-4xl font-bold text-gray-900">{absentCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Лучшие ученики</h3>
          <div className="space-y-3">
            {topStudents.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100 transition-colors">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                  i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md' :
                  i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md' :
                  i === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white shadow-md' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {i + 1}
                </div>
                <span className="flex-1 font-medium text-gray-900">{s.lastName} {s.firstName}</span>
                <span className="font-semibold text-blue-600">{s.avg.toFixed(2)}</span>
              </div>
            ))}
            {topStudents.length === 0 && <p className="text-gray-400 text-center py-8">Нет данных</p>}
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Требуют внимания</h3>
          <div className="space-y-3">
            {weakStudents.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-sm font-medium text-red-600">
                  {i + 1}
                </div>
                <span className="flex-1 font-medium text-gray-900">{s.lastName} {s.firstName}</span>
                <span className="font-semibold text-red-600">{s.avg.toFixed(2)}</span>
              </div>
            ))}
            {weakStudents.length === 0 && <p className="text-gray-400 text-center py-8">Нет данных</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-5">Средний балл по предметам</h3>
          <div className="space-y-4">
            {avgBySubject.map(item => (
              <div key={item.subject}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">{item.subject}</span>
                  <span className="font-semibold text-gray-900">{item.avg.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${item.avg >= 4.5 ? 'bg-gradient-to-r from-green-400 to-green-500' : item.avg >= 3.5 ? 'bg-gradient-to-r from-blue-400 to-blue-500' : item.avg >= 2.5 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                    style={{ width: `${(item.avg / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-12">Распределение оценок</h3>
          <div className="flex items-end justify-center gap-8 h-52 mt-6">
            {[5, 4, 3, 2].map(v => {
              const count = distribution[v as keyof typeof distribution] || 0;
              const pct = totalGrades > 0 ? (count / totalGrades) * 100 : 0;
              const colors = {
                5: 'bg-gradient-to-t from-green-400 to-green-500',
                4: 'bg-gradient-to-t from-blue-400 to-blue-500',
                3: 'bg-gradient-to-t from-yellow-400 to-yellow-500',
                2: 'bg-gradient-to-t from-red-400 to-red-500'
              };
              return (
                <div key={v} className="flex flex-col items-center gap-3">
                  <span className="text-lg font-semibold text-gray-700">{count}</span>
                  <div className={`w-16 rounded-t-lg ${colors[v as keyof typeof colors]} shadow-md`}
                    style={{ height: `${Math.max(pct * 1.8, 12)}px` }} />
                  <span className="text-sm font-medium text-gray-600">{v}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {todayLessons.length > 0 && (
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Расписание на сегодня</h3>
          <div className="space-y-3">
            {todayLessons.map(l => (
              <div key={l.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-sm font-medium text-white shadow-md">
                  {l.lessonNumber}
                </div>
                <span className="flex-1 font-medium text-gray-900">{l.subject}</span>
                {l.startTime && (
                  <span className="text-sm text-gray-500 bg-blue-50 px-3 py-1.5 rounded-lg">
                    {l.startTime}-{l.endTime}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur rounded-xl border border-white/50 p-5 text-center shadow-lg">
          <div className="text-3xl font-bold text-gray-900">{tests.length}</div>
          <div className="text-xs text-gray-500 mt-2 font-medium">Тестов</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl border border-white/50 p-5 text-center shadow-lg">
          <div className="text-3xl font-bold text-gray-900">{SUBJECTS.length}</div>
          <div className="text-xs text-gray-500 mt-2 font-medium">Предметов</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl border border-white/50 p-5 text-center shadow-lg">
          <div className="text-3xl font-bold text-gray-900">{lessons.length}</div>
          <div className="text-xs text-gray-500 mt-2 font-medium">Уроков в расписании</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl border border-white/50 p-5 text-center shadow-lg">
          <div className="text-3xl font-bold text-gray-900">{attendance.length}</div>
          <div className="text-xs text-gray-500 mt-2 font-medium">Отметок посещаемости</div>
        </div>
      </div>
    </div>
  );
};

// ==================== ATTENDANCE CALENDAR ====================
const AttendanceCalendar: React.FC = () => {
  const { students, lessons, attendance, setAttendance, lessonTypes } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Получить дни месяца
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    
    // Добавить дни предыдущего месяца для заполнения первой недели
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    
    // Добавить дни текущего месяца
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Добавить дни следующего месяца для заполнения последней недели
    const endDayOfWeek = lastDay.getDay() === 0 ? 6 : lastDay.getDay() - 1;
    for (let i = 1; i < 7 - endDayOfWeek; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);

  const formatDateStr = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Получить количество уроков на конкретную дату
  const getLessonsCount = (date: Date) => {
    const dateStr = formatDateStr(date);
    return lessons.filter(l => l.date === dateStr).length;
  };

  // Получить уроки на дату
  const getLessonsForDate = (date: Date) => {
    const dateStr = formatDateStr(date);
    return lessons.filter(l => l.date === dateStr).sort((a, b) => a.lessonNumber - b.lessonNumber);
  };

  // Проверить, является ли дата текущим днём
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  // Проверить, относится ли дата к текущему месяцу
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Получить все записи посещаемости для даты и ученика
  const getAttendanceForStudentDate = (studentId: string, date: string) => {
    return attendance.filter(a => a.studentId === studentId && a.date === date);
  };

  // Получить уникальных учеников с пропусками на дату
  const getAbsentStudentsForDate = (date: string) => {
    const dateStr = formatDateStr(new Date(date));
    const presentStudents = new Set(attendance.filter(a => a.date === dateStr).map(a => a.studentId));
    return students.filter(s => presentStudents.has(s.id));
  };

  // Обработчик клика на ячейку даты
  const handleDateClick = (date: Date) => {
    const dateStr = formatDateStr(date);
    const lessonsCount = getLessonsCount(date);
    if (lessonsCount > 0) {
      setSelectedDate(dateStr);
    }
  };

  // Установить/изменить отметку посещаемости
  const setAttendanceForLesson = (studentId: string, date: string, subject: string, lessonNumber: number, type: AttendanceRecord['type'] | null) => {
    setAttendance(prev => {
      // Удаляем существующие записи для этой комбинации
      const filtered = prev.filter(a => 
        !(a.studentId === studentId && a.date === date && a.subject === subject && a.lessonNumber === lessonNumber)
      );
      
      if (type) {
        return [...filtered, { 
          id: `at${Date.now()}${Math.random().toString(36).slice(2, 6)}`, 
          studentId, 
          date, 
          subject, 
          type,
          lessonNumber
        }];
      }
      return filtered;
    });
  };

  // Установить отметку на весь день
  const setAttendanceForDay = (studentId: string, date: string, type: AttendanceRecord['type'] | null) => {
    const dayLessons = getLessonsForDate(new Date(date));
    setAttendance(prev => {
      // Удаляем все существующие записи для этого ученика и даты
      const filtered = prev.filter(a => 
        !(a.studentId === studentId && a.date === date)
      );

      if (type) {
        // Добавляем записи для каждого урока
        const newRecords = dayLessons.map(lesson => ({
          id: `at${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
          studentId,
          date,
          subject: lesson.subject,
          type,
          lessonNumber: lesson.lessonNumber
        }));
        return [...filtered, ...newRecords];
      }
      return filtered;
    });
  };

  // Получить отметку для конкретного урока
  const getAttendanceForLesson = (studentId: string, date: string, subject: string, lessonNumber: number): AttendanceRecord['type'] | null => {
    const record = attendance.find(a => 
      a.studentId === studentId && a.date === date && a.subject === subject && a.lessonNumber === lessonNumber
    );
    return record?.type || null;
  };

  // Предыдущий месяц
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Следующий месяц
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Навигация по месяцам
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Заголовок и навигация */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Посещаемость</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
          >
            Сегодня
          </button>
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Легенда */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-2xl">
        <span className="text-sm font-medium text-gray-600">Типы отметок:</span>
        {ATTENDANCE_TYPES.map((type: any) => (
          <div key={type.value} className="flex items-center gap-2">
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${type.bgColor} ${type.color}`}>
              {type.short}
            </span>
            <span className="text-sm text-gray-600">{type.label}</span>
          </div>
        ))}
      </div>

      {/* Календарь */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 shadow-lg overflow-hidden">
        {/* Дни недели */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, i) => (
            <div key={i} className="px-2 py-3 text-center text-sm font-semibold text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Дни месяца */}
        <div className="grid grid-cols-7">
          {monthDays.map((date, idx) => {
            const lessonsCount = getLessonsCount(date);
            const hasLessons = lessonsCount > 0;
            const isSelected = selectedDate === formatDateStr(date);
            
            return (
              <button
                key={idx}
                onClick={() => handleDateClick(date)}
                disabled={!hasLessons}
                className={`
                  min-h-[80px] p-2 border-b-2 border-r-2 border-gray-300 transition-all
                  ${!isCurrentMonth(date) ? 'bg-gray-30' : 'bg-white hover:bg-gray-50'}
                  ${isToday(date) ? 'bg-blue-50' : ''}
                  ${isSelected ? 'ring-2 ring-inset ring-primary-500 bg-primary-50' : ''}
                  ${!hasLessons ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className={`text-sm font-medium ${isToday(date) ? 'text-primary-600' : isCurrentMonth(date) ? 'text-gray-900' : 'text-gray-400'}`}>
                  {date.getDate()}
                </div>
                {hasLessons && (
                  <div className="mt-1 text-xs font-medium text-gray-500">
                    {lessonsCount} урок{lessonsCount === 1 ? '' : lessonsCount > 1 && lessonsCount < 5 ? 'а' : 'ов'}
                  </div>
                )}
                {/* Индикаторы посещаемости */}
                {hasLessons && (
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {ATTENDANCE_TYPES.slice(0, 3).map((type: any) => {
                      const count = attendance.filter(a => 
                        a.date === formatDateStr(date) && a.type === type.value
                      ).length;
                      if (count === 0) return null;
                      return (
                        <span key={type.value} className={`w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center ${type.bgColor} ${type.color}`}>
                          {count}
                        </span>
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Модальное окно для работы с посещаемостью */}
      {selectedDate && (
        <AttendanceModal
          date={selectedDate}
          lessons={getLessonsForDate(new Date(selectedDate))}
          students={students}
          attendance={attendance}
          onClose={() => setSelectedDate(null)}
          onSetAttendance={setAttendanceForDay}
          onSetAttendanceForLesson={setAttendanceForLesson}
          getAttendanceForLesson={getAttendanceForLesson}
        />
      )}
    </div>
  );
};

// ==================== ATTENDANCE MODAL ====================
const AttendanceModal: React.FC<{
  date: string;
  lessons: any[];
  students: any[];
  attendance: any[];
  onClose: () => void;
  onSetAttendance: (studentId: string, date: string, type: AttendanceRecord['type'] | null) => void;
  onSetAttendanceForLesson: (studentId: string, date: string, subject: string, lessonNumber: number, type: AttendanceRecord['type'] | null) => void;
  getAttendanceForLesson: (studentId: string, date: string, subject: string, lessonNumber: number) => AttendanceRecord['type'] | null;
}> = ({ date, lessons, students, attendance, onClose, onSetAttendance, onSetAttendanceForLesson, getAttendanceForLesson }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [wholeDay, setWholeDay] = useState(false);
  const [selectedType, setSelectedType] = useState<AttendanceRecord['type'] | null>(null);
  const [selectedLessons, setSelectedLessons] = useState<number[]>([]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00');
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Переключить выбор урока
  const toggleLesson = (lessonNumber: number) => {
    setSelectedLessons(prev => 
      prev.includes(lessonNumber) 
        ? prev.filter(n => n !== lessonNumber)
        : [...prev, lessonNumber]
    );
  };

  // Применить отметку
  const applyAttendance = () => {
    if (!selectedStudentId || !selectedType) return;

    if (wholeDay) {
      // Отметить весь день
      onSetAttendance(selectedStudentId, date, selectedType);
    } else if (selectedLessons.length > 0) {
      // Отметить только выбранные уроки
      selectedLessons.forEach(lessonNumber => {
        const lesson = lessons.find(l => l.lessonNumber === lessonNumber);
        if (lesson) {
          onSetAttendanceForLesson(selectedStudentId, date, lesson.subject, lessonNumber, selectedType);
        }
      });
    }

    // Сбросить выбор
    setSelectedType(null);
    setSelectedLessons([]);
    setWholeDay(false);
    setSelectedStudentId(null);
  };

  // Удалить отметку
  const removeAttendance = () => {
    if (!selectedStudentId) return;

    if (wholeDay) {
      onSetAttendance(selectedStudentId, date, null);
    } else if (selectedLessons.length > 0) {
      selectedLessons.forEach(lessonNumber => {
        const lesson = lessons.find(l => l.lessonNumber === lessonNumber);
        if (lesson) {
          onSetAttendanceForLesson(selectedStudentId, date, lesson.subject, lessonNumber, null);
        }
      });
    }

    // Сбросить выбор
    setSelectedType(null);
    setSelectedLessons([]);
    setWholeDay(false);
    setSelectedStudentId(null);
  };

  // Получить текущую отметку для выбранного ученика
  const getCurrentAttendance = () => {
    if (!selectedStudentId) return null;
    
    if (wholeDay) {
      const dayAttendance = attendance.filter(a => a.studentId === selectedStudentId && a.date === date);
      if (dayAttendance.length === lessons.length && lessons.length > 0) {
        const firstType = dayAttendance[0].type;
        if (dayAttendance.every(a => a.type === firstType)) {
          return firstType;
        }
      }
      return null;
    } else if (selectedLessons.length > 0) {
      const types = selectedLessons.map(ln => getAttendanceForLesson(selectedStudentId, date, lessons.find(l => l.lessonNumber === ln)?.subject || '', ln));
      if (types.every(t => t !== null) && types.every(t => t === types[0])) {
        return types[0];
      }
    }
    return null;
  };

  const currentAttendance = getCurrentAttendance();
  const sortedStudents = [...students].sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));

  return createPortal(
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Заголовок */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Посещаемость</h3>
            <p className="text-sm text-gray-500">{formatDate(date)} · {lessons.length} уроков</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Выбор ученика */}
        <div className="px-6 py-4 border-b border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Выберите ученика</label>
          <select
            value={selectedStudentId || ''}
            onChange={(e) => {
              setSelectedStudentId(e.target.value || null);
              setWholeDay(false);
              setSelectedLessons([]);
              setSelectedType(null);
            }}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          >
            <option value="">-- Выберите ученика --</option>
            {sortedStudents.map(student => (
              <option key={student.id} value={student.id}>
                {student.lastName} {student.firstName}
              </option>
            ))}
          </select>
        </div>

        {/* Выбор режима и типа */}
        {selectedStudentId && (
          <div className="px-6 py-4 border-b border-gray-100 space-y-4">
            {/* Показываем текущую отметку если есть - с быстрым изменением типа */}
            {currentAttendance && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-amber-800">Текущая отметка:</span>
                    {(() => {
                      const attType = ATTENDANCE_TYPES.find(at => at.value === currentAttendance);
                      return attType ? (
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${attType.bgColor} ${attType.color}`}>
                          {attType.short} — {attType.label}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <button
                    onClick={removeAttendance}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" /> Удалить
                  </button>
                </div>
                {/* Быстрое изменение типа */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Быстро изменить тип:</p>
                  <div className="flex flex-wrap gap-2">
                    {ATTENDANCE_TYPES.map(type => (
                      <button
                        key={type.value}
                        onClick={() => {
                          setSelectedType(type.value);
                          // Автоматически применить при клике
                          if (wholeDay) {
                            onSetAttendance(selectedStudentId!, date, type.value);
                          } else if (selectedLessons.length > 0) {
                            selectedLessons.forEach(lessonNumber => {
                              const lesson = lessons.find(l => l.lessonNumber === lessonNumber);
                              if (lesson) {
                                onSetAttendanceForLesson(selectedStudentId!, date, lesson.subject, lessonNumber, type.value);
                              }
                            });
                          }
                        }}
                        className={`
                          px-3 py-2 rounded-lg text-sm font-bold transition-all
                          ${currentAttendance === type.value 
                            ? 'ring-2 ring-offset-2 ring-gray-400' 
                            : 'hover:scale-105'
                          } ${type.bgColor} ${type.color}
                        `}
                      >
                        {type.short} — {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Режим "Весь день" */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={wholeDay}
                onChange={(e) => {
                  setWholeDay(e.target.checked);
                  if (e.target.checked) {
                    setSelectedLessons(lessons.map(l => l.lessonNumber));
                  } else {
                    setSelectedLessons([]);
                  }
                }}
                className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-900">Весь день (все {lessons.length} уроков)</span>
            </label>

            {/* Выбор уроков (если не весь день) */}
            {!wholeDay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Выберите конкретные уроки:</label>
                <div className="flex flex-wrap gap-2">
                  {lessons.map(lesson => {
                    const isSelected = selectedLessons.includes(lesson.lessonNumber);
                    const currentType = getAttendanceForLesson(selectedStudentId, date, lesson.subject, lesson.lessonNumber);
                    const attType = currentType ? ATTENDANCE_TYPES.find(at => at.value === currentType) : null;
                    
                    return (
                      <button
                        key={lesson.lessonNumber}
                        onClick={() => {
                          toggleLesson(lesson.lessonNumber);
                          // Если урок уже отмечен - показать текущий тип
                          if (!isSelected && currentType) {
                            setSelectedType(currentType);
                          }
                        }}
                        className={`
                          px-3 py-2 rounded-lg text-sm font-medium transition-all
                          ${isSelected 
                            ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500' 
                            : currentType 
                              ? `${attType?.bgColor} ${attType?.color} ring-1 ring-gray-300`
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }
                        `}
                      >
                        {lesson.lessonNumber}. {lesson.subject}
                        {currentType && <span className="ml-1">({currentType})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Кнопки действий */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-between bg-gray-50">
          <div>
            {selectedStudentId && (
              <button
                onClick={removeAttendance}
                className="px-5 py-2.5 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-medium flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Удалить отметку
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Закрыть
            </button>
            <button
              onClick={applyAttendance}
              disabled={!selectedStudentId || !selectedType || (selectedLessons.length === 0 && !wholeDay)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Применить
            </button>
          </div>
        </div>

        {/* Список учеников с отметками - кликабельный */}
        <div className="flex-1 overflow-auto p-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Отметки на {formatDate(date)} (кликните для редактирования):</h4>
          <div className="space-y-2">
            {sortedStudents.map(student => {
              const studentAttendance = attendance.filter(a => a.studentId === student.id && a.date === date);
              if (studentAttendance.length === 0) return null;
              
              // Группируем по типу
              const byType: Record<string, number> = {};
              studentAttendance.forEach(a => {
                byType[a.type] = (byType[a.type] || 0) + 1;
              });
              
              // Определяем основной тип (если все одинаковые)
              const types = Object.keys(byType);
              const isUniform = types.length === 1;
              const mainType = isUniform ? types[0] : null;
              
              return (
                <button
                  key={student.id}
                  onClick={() => {
                    setSelectedStudentId(student.id);
                    setWholeDay(true);
                    setSelectedLessons(lessons.map(l => l.lessonNumber));
                    // Если все отметки одинаковые - выбираем этот тип
                    if (mainType) {
                      setSelectedType(mainType as AttendanceRecord['type']);
                    } else {
                      setSelectedType(null);
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-primary-50 rounded-xl transition-colors border border-transparent hover:border-primary-200"
                >
                  <span className="font-medium text-gray-900">{student.lastName} {student.firstName}</span>
                  <div className="flex gap-1">
                    {Object.entries(byType).map(([type, count]) => {
                      const attType = ATTENDANCE_TYPES.find(at => at.value === type);
                      return (
                        <span key={type} className={`px-2 py-1 rounded-lg text-xs font-bold ${attType?.bgColor} ${attType?.color}`}>
                          {type}: {count}
                        </span>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
          {sortedStudents.every(s => attendance.filter(a => a.studentId === s.id && a.date === date).length === 0) && (
            <p className="text-center text-gray-500 py-4">Нет отметок о посещаемости</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ==================== GRADE PICKER PORTAL ====================
const GradePickerPortal: React.FC<{
  anchorRect: DOMRect;
  currentGrade?: number;
  currentExcludeFromAverage?: boolean;
  currentReason?: string;
  studentName?: string;
  date?: string;
  onSelect: (v: number, excludeFromAverage?: boolean, reason?: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}> = ({ anchorRect, currentGrade, currentExcludeFromAverage, currentReason, studentName, date, onSelect, onDelete, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [excludeFromAverage, setExcludeFromAverage] = useState(currentExcludeFromAverage || false);
  const [reason, setReason] = useState(currentReason || '');
  const [showReasonInput, setShowReasonInput] = useState(!!currentReason);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    setExcludeFromAverage(currentExcludeFromAverage || false);
  }, [currentExcludeFromAverage]);

  useEffect(() => {
    setReason(currentReason || '');
    setShowReasonInput(!!currentReason);
  }, [currentReason]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00');
    return `${d.getDate()} ${MONTH_NAMES_GEN[d.getMonth()]}`;
  };

  const handleSelect = (v: number) => {
    onSelect(v, excludeFromAverage, reason.trim() || undefined);
  };

  // Сохранить только основание (для уже выставленной оценки)
  const handleSaveReason = () => {
    if (currentGrade !== undefined) {
      onSelect(currentGrade, excludeFromAverage, reason.trim() || undefined);
    }
  };

  const widgetW = 240;
  const widgetH = currentGrade ? 260 : 160;
  let top = anchorRect.bottom + 4;
  let left = anchorRect.left + anchorRect.width / 2 - widgetW / 2;
  if (top + widgetH > window.innerHeight) top = anchorRect.top - widgetH - 4;
  if (left < 8) left = 8;
  if (left + widgetW > window.innerWidth - 8) left = window.innerWidth - widgetW - 8;

  return createPortal(
    <div ref={ref} className="fixed z-[100] bg-white rounded-xl shadow-2xl border border-gray-200 p-2 animate-scaleIn"
      style={{ top, left, width: widgetW }}>
      {(studentName || date) && (
        <div className="text-xs text-gray-500 border-b border-gray-100 pb-1.5 mb-2">
          {date && <div className="font-medium text-gray-700">{formatDate(date)}</div>}
          {studentName && <div className="truncate">{studentName}</div>}
        </div>
      )}
      <div className="flex gap-1.5 justify-center">
        {[5, 4, 3, 2].map(v => (
          <button key={v} onClick={() => handleSelect(v)}
            className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
              v === 5 ? 'bg-green-100 text-green-700 hover:bg-green-200' :
              v === 4 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
              v === 3 ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
              'bg-red-100 text-red-700 hover:bg-red-200'
            } ${currentGrade === v ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}>
            {v}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 mt-2 px-1 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={excludeFromAverage}
          onChange={(e) => setExcludeFromAverage(e.target.checked)}
          className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
        />
        <span className="text-xs text-gray-600">Не учитывать в среднем</span>
      </label>
      
      {/* Поле для ввода основания оценки */}
      <div className="mt-2">
        {showReasonInput ? (
          <div className="space-y-1.5">
            <div className="relative">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="За что оценка..."
                className="w-full px-2 py-1.5 pr-7 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                onClick={() => { setShowReasonInput(false); setReason(''); }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            {currentGrade !== undefined && (
              <button
                onClick={handleSaveReason}
                className="w-full py-1 text-xs bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg transition-colors"
              >
                Сохранить основание
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowReasonInput(true)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition-colors"
          >
            <Info className="w-3 h-3" /> {currentGrade !== undefined ? 'Изменить основание' : 'Добавить основание'}
          </button>
        )}
      </div>

      {currentGrade && onDelete && (
        <button onClick={onDelete} className="w-full mt-1.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1">
          <Trash2 className="w-3 h-3" /> Удалить
        </button>
      )}
    </div>,
    document.body
  );
};

// ==================== ATTENDANCE PICKER PORTAL ====================
const AttendancePickerPortal: React.FC<{
  anchorRect: DOMRect;
  currentType?: AttendanceRecord['type'];
  onSelect: (type: AttendanceRecord['type']) => void;
  onDelete: () => void;
  onClose: () => void;
}> = ({ anchorRect, currentType, onSelect, onDelete, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const widgetW = 220;
  let top = anchorRect.bottom + 4;
  let left = anchorRect.left + anchorRect.width / 2 - widgetW / 2;
  if (top + 120 > window.innerHeight) top = anchorRect.top - 120;
  if (left < 8) left = 8;
  if (left + widgetW > window.innerWidth - 8) left = window.innerWidth - widgetW - 8;

  return createPortal(
    <div ref={ref} className="fixed z-[100] bg-white rounded-xl shadow-2xl border border-gray-200 p-2 animate-scaleIn"
      style={{ top, left, width: widgetW }}>
      <div className="grid grid-cols-2 gap-1.5">
        {ATTENDANCE_TYPES.map(at => (
          <button key={at.value} onClick={() => onSelect(at.value)}
            className={`px-2 py-2 rounded-lg text-xs font-bold transition-all ${at.bgColor} ${at.color} ${currentType === at.value ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}>
            {at.short} — {at.label.slice(0, 10)}
          </button>
        ))}
      </div>
      {currentType && (
        <button onClick={onDelete} className="w-full mt-1.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1">
          <Trash2 className="w-3 h-3" /> Удалить
        </button>
      )}
    </div>,
    document.body
  );
};

// ==================== JOURNAL ====================
const Journal: React.FC = () => {
  const {
    students, grades, setGrades, diaryEntries, setDiaryEntries, lessons,
    journalColumns, setJournalColumns, lessonTypes, setLessonTypes,
    customLessonTypes, attendance, setAttendance, tests,
    testAttempts, testRetakes, setTestRetakes, setTestAttempts,
    testAssignments, setTestAssignments,
  } = useData();

  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [journalTab, setJournalTab] = useState<'grades' | 'topics' | 'attendance'>('grades');
  const [showSettings, setShowSettings] = useState(false);
  const [showTrend, setShowTrend] = useState(true);
  const [showNotAsked, setShowNotAsked] = useState(true);
  const [showFutureDates, setShowFutureDates] = useState(true);
  const [highlightToday, setHighlightToday] = useState(true);
  const [inputMode, setInputMode] = useState<'widget' | 'keyboard'>('widget');
  const [keyboardTarget, setKeyboardTarget] = useState<{ studentId: string; date: string; columnId?: string; lessonNumber?: number } | null>(null);
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');

  // Функция для получения ключа localStorage для настроек предмета
  const getSettingsKey = (subject: string) => `journal_settings_${subject}`;

  // Загрузка настроек при смене предмета
  useEffect(() => {
    const settingsKey = getSettingsKey(selectedSubject);
    const saved = localStorage.getItem(settingsKey);
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings.showTrend !== undefined) setShowTrend(settings.showTrend);
        if (settings.showNotAsked !== undefined) setShowNotAsked(settings.showNotAsked);
        if (settings.showFutureDates !== undefined) setShowFutureDates(settings.showFutureDates);
        if (settings.highlightToday !== undefined) setHighlightToday(settings.highlightToday);
        if (settings.inputMode !== undefined) setInputMode(settings.inputMode);
      } catch (e) {
        console.error('Error loading journal settings:', e);
      }
    } else {
      // Сбросить на значения по умолчанию если нет сохранённых настроек
      setShowTrend(true);
      setShowNotAsked(true);
      setShowFutureDates(true);
      setHighlightToday(true);
      setInputMode('widget');
    }
  }, [selectedSubject]);

  // Сохранение настроек при их изменении
  useEffect(() => {
    const settingsKey = getSettingsKey(selectedSubject);
    const settings = {
      showTrend,
      showNotAsked,
      showFutureDates,
      highlightToday,
      inputMode,
    };
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  }, [selectedSubject, showTrend, showNotAsked, showFutureDates, highlightToday, inputMode]);
  const [gradePickerState, setGradePickerState] = useState<{ rect: DOMRect; studentId: string; date: string; columnId?: string; lessonNumber?: number } | null>(null);
  const [attendancePickerState, setAttendancePickerState] = useState<{ rect: DOMRect; studentId: string; date: string } | null>(null);
  const [popoverDate, setPopoverDate] = useState<string | null>(null);
  const [popoverRect, setPopoverRect] = useState<DOMRect | null>(null);
  const [lessonPageDate, setLessonPageDate] = useState<string | null>(null);
  const [lessonPageLessonNum, setLessonPageLessonNum] = useState<number>(1);
  const popoverRef = useRef<HTMLDivElement>(null);
  const today = getTodayString();

  // Обработка ввода с клавиатуры
  useEffect(() => {
    if (inputMode !== 'keyboard' || !keyboardTarget) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (['2', '3', '4', '5'].includes(key)) {
        e.preventDefault();
        const value = parseInt(key);
        setGrade(keyboardTarget.studentId, keyboardTarget.date, value, keyboardTarget.columnId, keyboardTarget.lessonNumber);
        setKeyboardTarget(null);
      } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
        e.preventDefault();
        deleteGrade(keyboardTarget.studentId, keyboardTarget.date, keyboardTarget.columnId, keyboardTarget.lessonNumber);
        setKeyboardTarget(null);
      } else if (key === 'Escape') {
        e.preventDefault();
        setKeyboardTarget(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [inputMode, keyboardTarget]);

  // Check for journal open parameters from schedule
  useEffect(() => {
    const params = localStorage.getItem('open_journal_params');
    if (params) {
      try {
        const { subject, date, lessonNumber } = JSON.parse(params);
        localStorage.removeItem('open_journal_params');
        if (subject && date) {
          setSelectedSubject(subject);
          setLessonPageDate(date);
          setLessonPageLessonNum(lessonNumber || 1);
        }
      } catch (e) {
        console.error('Error parsing journal params:', e);
      }
    }
  }, [setSelectedSubject, setLessonPageDate, setLessonPageLessonNum]);

  const sortedStudents = useMemo(() =>
    [...students].sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)),
    [students]
  );

  // Функция проверки - заблокирована ли дата для ученика (до даты зачисления)
  const isDateBeforeEnrollment = (studentId: string, date: string): boolean => {
    const student = students.find(s => s.id === studentId);
    if (!student || !student.enrollmentDate) return false; // Если нет даты зачисления - доступно всё
    return date < student.enrollmentDate;
  };

  // Each lesson = one slot in the journal (date + lessonNumber)
  const allSlots = useMemo(() => {
    const today = getTodayString();
    return lessons
      .filter(l => l.subject === selectedSubject)
      .filter(l => showFutureDates || l.date <= today)
      .filter(l => !periodStart || l.date >= periodStart)
      .filter(l => !periodEnd || l.date <= periodEnd)
      .map(l => ({ date: l.date, lessonNumber: l.lessonNumber, key: `${l.date}_${l.lessonNumber}` }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.lessonNumber - b.lessonNumber);
  }, [lessons, selectedSubject, showFutureDates, periodStart, periodEnd]);

  // For backward compatibility, unique dates list
  const allDates = useMemo(() => {
    const s = new Set<string>();
    allSlots.forEach(sl => s.add(sl.date));
    return Array.from(s).sort();
  }, [allSlots]);

  const monthGroups = useMemo(() => {
    const groups: { month: string; slots: typeof allSlots }[] = [];
    let currentMonth = '';
    allSlots.forEach(sl => {
      const m = MONTH_NAMES[parseInt(sl.date.split('-')[1]) - 1]?.slice(0, 3) || '';
      if (m !== currentMonth) { currentMonth = m; groups.push({ month: m, slots: [sl] }); }
      else { groups[groups.length - 1].slots.push(sl); }
    });
    return groups;
  }, [allSlots]);

  // unused removed

  const getColumnsForSlot = (date: string, lessonNumber: number) => {
    return journalColumns.filter(c => c.date === date && c.subject === selectedSubject && (c.lessonNumber === lessonNumber || (!c.lessonNumber && lessonNumber === 0)));
  };

  // Legacy: get columns for date (used in lesson page and popover)
  const getColumnsForDate = (date: string) => {
    return journalColumns.filter(c => c.date === date && c.subject === selectedSubject);
  };

  const addColumn = (date: string, lessonNumber?: number) => {
    setJournalColumns(prev => [...prev, { id: `jc${Date.now()}`, date, subject: selectedSubject, lessonNumber, type: 'grade' }]);
  };

  const removeColumn = (colId: string) => {
    setJournalColumns(prev => prev.filter(c => c.id !== colId));
    setGrades(prev => prev.filter(g => g.columnId !== colId));
  };

  const getGrade = (studentId: string, date: string, columnId?: string, lessonNumber?: number) => {
    const result = grades.find(g => g.studentId === studentId && g.date === date && g.subject === selectedSubject
      && (columnId ? g.columnId === columnId : !g.columnId)
      && (lessonNumber !== undefined ? g.lessonNumber === lessonNumber : true));
    // Логирование для отладки поиска оценок в колонках
    if (columnId && result) {
      console.log('getGrade found column grade:', { studentId, date, columnId, lessonNumber, grade: result });
    } else if (columnId) {
      console.log('getGrade NOT found column grade:', { studentId, date, columnId, lessonNumber, matchingGrades: grades.filter(g => g.studentId === studentId && g.date === date && g.subject === selectedSubject) });
    }
    return result;
  };

  const setGrade = (studentId: string, date: string, value: number, columnId?: string, lessonNumber?: number, excludeFromAverage?: boolean, reason?: string) => {
    setGrades(prev => {
      const existing = prev.find(g => g.studentId === studentId && g.date === date && g.subject === selectedSubject
        && (columnId ? g.columnId === columnId : !g.columnId)
        && (lessonNumber !== undefined ? g.lessonNumber === lessonNumber : true));
      if (existing) return prev.map(g => g.id === existing.id ? { ...g, value, excludeFromAverage, reason } : g);
      return [...prev, { id: `g${Date.now()}${Math.random().toString(36).slice(2, 6)}`, studentId, subject: selectedSubject, value, date, lessonNumber, columnId, excludeFromAverage, reason }];
    });
  };

  const deleteGrade = (studentId: string, date: string, columnId?: string, lessonNumber?: number) => {
    setGrades(prev => prev.filter(g => !(g.studentId === studentId && g.date === date && g.subject === selectedSubject
      && (columnId ? g.columnId === columnId : !g.columnId)
      && (lessonNumber !== undefined ? g.lessonNumber === lessonNumber : true))));
  };

  const getLessonType = (date: string, lessonNumber?: number) => {
    const lessonNum = lessonNumber ?? 0;
    // ONLY exact match — no fallback
    return lessonTypes.find(lt => lt.date === date && lt.subject === selectedSubject && ((lt as any).lessonNumber === lessonNum || (!lt.lessonNumber && lessonNum === 0)));
  };

  const getAttendanceMark = (studentId: string, date: string) => {
    return attendance.find(a => a.studentId === studentId && a.date === date && a.subject === selectedSubject);
  };

  const setAttendanceMark = (studentId: string, date: string, type: AttendanceRecord['type']) => {
    setAttendance(prev => {
      const existing = prev.find(a => a.studentId === studentId && a.date === date && a.subject === selectedSubject);
      if (existing) return prev.map(a => a.id === existing.id ? { ...a, type } : a);
      return [...prev, { id: `at${Date.now()}${Math.random().toString(36).slice(2, 6)}`, studentId, date, subject: selectedSubject, type }];
    });
  };

  const deleteAttendanceMark = (studentId: string, date: string) => {
    setAttendance(prev => prev.filter(a => !(a.studentId === studentId && a.date === date && a.subject === selectedSubject)));
  };

  const getStudentAvg = (studentId: string) => {
    if (!grades || !lessons) return 0;
    const sg = grades.filter(g =>
      g.studentId === studentId &&
      g.subject === selectedSubject &&
      !g.excludeFromAverage && // Исключаем оценки, не учитываемые в среднем балле
      lessons.some(l => l.date === g.date && l.subject === selectedSubject)
    );
    return sg.length > 0 ? sg.reduce((a, g) => a + g.value, 0) / sg.length : 0;
  };

  const getStudentTrend = (studentId: string) => {
    if (!grades || !lessons) return 0;
    const sg = grades.filter(g =>
      g.studentId === studentId &&
      g.subject === selectedSubject &&
      !g.excludeFromAverage && // Исключаем оценки, не учитываемые в среднем балле
      lessons.some(l => l.date === g.date && l.subject === selectedSubject)
    ).sort((a, b) => a.date.localeCompare(b.date));
    if (sg.length < 2) return 0;
    const mid = Math.floor(sg.length / 2);
    const firstHalf = sg.slice(0, mid);
    const secondHalf = sg.slice(mid);
    const avgFirst = firstHalf.reduce((a, g) => a + g.value, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, g) => a + g.value, 0) / secondHalf.length;
    if (avgSecond - avgFirst > 0.2) return 1;
    if (avgFirst - avgSecond > 0.2) return -1;
    return 0;
  };

  const getLastGradeDate = (studentId: string) => {
    if (!grades || !lessons) return null;
    const sg = grades.filter(g =>
      g.studentId === studentId &&
      g.subject === selectedSubject &&
      !g.excludeFromAverage && // Исключаем оценки, не учитываемые в среднем балле
      lessons.some(l => l.date === g.date && l.subject === selectedSubject)
    ).sort((a, b) => b.date.localeCompare(a.date));
    return sg.length > 0 ? sg[0].date : null;
  };

  const getOrCreateDiaryEntry = (date: string, lessonNumber?: number) => {
    const lessonNum = lessonNumber ?? 1;
    // Защита от undefined
    if (!diaryEntries || !Array.isArray(diaryEntries) || !setDiaryEntries) {
      return null;
    }
    // ONLY match by date + subject + lessonNumber — no fallback to avoid sharing between lessons
    const exact = diaryEntries.find(e => e.date === date && e.subject === selectedSubject && e.lessonNumber === lessonNum);
    if (exact) return exact;
    // Create a brand new entry for this specific lesson
    const newEntry = { id: `de${Date.now()}${Math.random().toString(36).slice(2, 6)}`, date, lessonNumber: lessonNum, subject: selectedSubject, topic: '', homework: '' };
    setDiaryEntries(prev => [...(prev || []), newEntry]);
    return newEntry;
  };

  // ==================== LESSON PAGE ====================
  if (lessonPageDate) {
    console.log('Rendering lesson page:', lessonPageDate, lessonPageLessonNum);
    if (!diaryEntries || !Array.isArray(diaryEntries) || !tests || !Array.isArray(tests)) {
      return (
        <div className="animate-fadeIn">
          <button onClick={() => setLessonPageDate(null)} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4 font-medium">
            <ArrowLeft className="w-4 h-4" /> Назад к журналу
          </button>
          <div className="text-center py-12 text-gray-500">Загрузка данных...</div>
        </div>
      );
    }

    const entry = diaryEntries.find(e => e.date === lessonPageDate && e.subject === selectedSubject && e.lessonNumber === lessonPageLessonNum);
    const lpLessonType = getLessonType(lessonPageDate, lessonPageLessonNum);
    const cols = getColumnsForSlot(lessonPageDate, lessonPageLessonNum);
    console.log('Lesson page - columns for slot:', { date: lessonPageDate, lessonNumber: lessonPageLessonNum, cols });
    const assignedTest = entry?.testId ? tests.find(t => t.id === entry.testId) : null;

    // Находим текущий индекс урока для навигации
    const currentSlotIndex = allSlots.findIndex(
      sl => sl.date === lessonPageDate && sl.lessonNumber === lessonPageLessonNum
    );
    const prevSlot = currentSlotIndex > 0 ? allSlots[currentSlotIndex - 1] : null;
    const nextSlot = currentSlotIndex < allSlots.length - 1 ? allSlots[currentSlotIndex + 1] : null;

    // Функция перехода на предыдущий/следующий урок
    const goToSlot = (slot: { date: string; lessonNumber: number } | null) => {
      if (slot) {
        setLessonPageDate(slot.date);
        setLessonPageLessonNum(slot.lessonNumber);
      }
    };

    // Simple calculation without useMemo - теперь включает и оценки, и посещаемость
    const last5Dates = (!grades || !Array.isArray(grades) || !attendance) ? [] : (() => {
      // Даты с оценками (без колонок)
      const gradeDates = new Set(
        grades
          .filter(g => g.subject === selectedSubject && g.date !== lessonPageDate && g.date < lessonPageDate && !g.columnId)
          .map(g => g.date)
      );
      // Даты с посещаемостью
      const attendanceDates = new Set(
        attendance
          .filter(a => a.subject === selectedSubject && a.date !== lessonPageDate && a.date < lessonPageDate)
          .map(a => a.date)
      );
      // Объединяем оба набора
      const allDatesSet = new Set([...gradeDates, ...attendanceDates]);
      return Array.from(allDatesSet).sort((a, b) => a.localeCompare(b)).slice(-5);
    })();

    const lpStudentGrades = (!sortedStudents || !grades || !lessons) ? [] : sortedStudents.map(s => {
      const avg = getStudentAvg(s.id);
      const trend = getStudentTrend(s.id);
      const lastDate = getLastGradeDate(s.id);
      const daysSinceLastGrade = lastDate ? Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000) : 999;
      // Проверяем последние 3 урока без оценки
      const last3Slots = [...allSlots].sort((a, b) => b.date.localeCompare(a.date) || b.lessonNumber - a.lessonNumber).slice(0, 3);
      const last3WithoutGrade = last3Slots.filter(sl => {
        const mainGrade = getGrade(s.id, sl.date, undefined, sl.lessonNumber);
        const cols = getColumnsForSlot(sl.date, sl.lessonNumber);
        const hasAnyGrade = mainGrade || cols.some(c => getGrade(s.id, sl.date, c.id, sl.lessonNumber));
        return !hasAnyGrade;
      }).length;
      const hasNoGradesAtAll = avg === 0;
      return { ...s, avg, trend, daysSinceLastGrade, last3WithoutGrade, hasNoGradesAtAll };
    });

    return (
      <div className="animate-fadeIn space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setLessonPageDate(null)} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
            <ArrowLeft className="w-4 h-4" /> Назад к журналу
          </button>
          {/* Навигация по урокам */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToSlot(prevSlot)}
              disabled={!prevSlot}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                prevSlot
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
              title={prevSlot ? `Урок ${prevSlot.lessonNumber} ${prevSlot.date}` : 'Нет предыдущего урока'}
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span className="hidden sm:inline">Предыдущий</span>
            </button>
            <span className="text-sm text-gray-400 px-2">
              {currentSlotIndex + 1} / {allSlots.length}
            </span>
            <button
              onClick={() => goToSlot(nextSlot)}
              disabled={!nextSlot}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                nextSlot
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
              title={nextSlot ? `Урок ${nextSlot.lessonNumber} ${nextSlot.date}` : 'Нет следующего урока'}
            >
              <span className="hidden sm:inline">Следующий</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 text-gray-900 shadow-soft-xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{selectedSubject}</h2>
                <span className="px-2.5 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium">
                  Урок №{lessonPageLessonNum}
                </span>
              </div>
              <p className="text-gray-600 text-lg">
                {new Date(lessonPageDate + 'T00:00').getDate()} {MONTH_NAMES_GEN[new Date(lessonPageDate + 'T00:00').getMonth()]} {new Date(lessonPageDate + 'T00:00').getFullYear()}
              </p>
            </div>
            {lpLessonType && (() => {
              const lt = customLessonTypes.find(c => c.value === lpLessonType.type);
              return lt ? (
                <div className={`px-4 py-2 rounded-xl text-sm font-bold ${lt.color}`}>
                  {lt.label}
                </div>
              ) : null;
            })()}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 shadow-soft space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Тема урока</label>
              <input type="text" value={entry?.topic || ''} onChange={e => {
                const ent = getOrCreateDiaryEntry(lessonPageDate, lessonPageLessonNum);
                if (ent) setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, topic: e.target.value } : de));
              }} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all placeholder-gray-400" placeholder="Тема урока..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Домашнее задание</label>
              <div className="relative">
                <input type="text" value={entry?.homework || ''} onChange={e => {
                  const ent = getOrCreateDiaryEntry(lessonPageDate, lessonPageLessonNum);
                  if (ent) setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, homework: e.target.value } : de));
                }} className="w-full px-4 py-3 pr-20 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all placeholder-gray-400" placeholder="ДЗ..." />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {entry?.attachment && (
                    <>
                      <div className="bg-white p-1 rounded-lg">
                        <a href={entry.attachment.url} download={entry.attachment.name} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg block transition-colors" title="Скачать файл">
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                      <div className="bg-white p-1 rounded-lg">
                        <button onClick={() => {
                          const ent = getOrCreateDiaryEntry(lessonPageDate, lessonPageLessonNum);
                          if (ent) {
                            setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, attachment: undefined } : de));
                          }
                        }} className="p-1 text-red-500 hover:bg-red-50 rounded-lg block transition-colors" title="Удалить файл">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                  {!entry?.attachment && (
                    <label className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer bg-white" title="Прикрепить файл">
                      <Paperclip className="w-4 h-4" />
                      <input type="file" className="hidden" onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const { name, url } = await uploadHomeworkFile(file);
                            const ent = getOrCreateDiaryEntry(lessonPageDate, lessonPageLessonNum);
                            if (ent) {
                              setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, attachment: { name, url } } : de));
                            }
                          } catch (err) {
                            console.error('Upload error:', err);
                            alert('Ошибка загрузки файла');
                          }
                        }
                        e.target.value = '';
                      }} />
                    </label>
                  )}
                </div>
              </div>
              {entry?.attachment && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                  <Paperclip className="w-4 h-4" />
                  <span className="truncate">{entry.attachment.name}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Тип урока</label>
              <select value={lpLessonType?.type || ''} onChange={e => {
                const val = e.target.value;
                setLessonTypes(prev => {
                  const existing = prev.find(lt => lt.date === lessonPageDate && lt.subject === selectedSubject && (lt.lessonNumber === lessonPageLessonNum || (!lt.lessonNumber && !lessonPageLessonNum)));
                  if (existing) return prev.map(lt => lt.id === existing.id ? { ...lt, type: val, lessonNumber: lessonPageLessonNum } : lt);
                  return [...prev, { id: `lt${Date.now()}`, date: lessonPageDate, subject: selectedSubject, type: val, lessonNumber: lessonPageLessonNum }];
                });
              }} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none cursor-pointer">
                <option value="">Не указан</option>
                {customLessonTypes && Array.isArray(customLessonTypes) && customLessonTypes.map(lt => <option key={lt.id} value={lt.value}>{lt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Домашнее задание</label>
              <textarea
                value={entry?.homework || ''}
                onChange={e => {
                  const newHomework = e.target.value;
                  setDiaryEntries(prev => {
                    const existing = prev.find(d => d.date === lessonPageDate && d.subject === selectedSubject && (d.lessonNumber === lessonPageLessonNum || (!d.lessonNumber && !lessonPageLessonNum)));
                    if (existing) return prev.map(d => d.id === existing.id ? { ...d, homework: newHomework } : d);
                    return [...prev, { id: `de${Date.now()}`, date: lessonPageDate, subject: selectedSubject, homework: newHomework, lessonNumber: lessonPageLessonNum }];
                  });
                }}
                placeholder="Введите домашнее задание..."
                rows={3}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
              />
            </div>
          </div>
      </div>
    </div>
  );
};

// ==================== STUDENTS MANAGER ====================
const StudentsManager: React.FC = () => {
  const { students, setStudents, setGrades, setAttendance, setTestAttempts, setTestRetakes } = useData();
  const [search, setSearch] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    username: '', 
    password: '',
    enrollmentDate: getTodayString() 
  });

  const generatePassword = () => Math.random().toString(36).slice(2, 8);
  
  const generateUsername = (lastName: string, firstName: string) => {
    return `${lastName.toLowerCase().replace(/[^а-яёa-z]/g, '')}.${firstName.toLowerCase().replace(/[^а-яёa-z]/g, '').charAt(0)}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  const sorted = useMemo(() =>
    [...students]
      .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`))
      .filter(s => `${s.lastName} ${s.firstName}`.toLowerCase().includes(search.toLowerCase())),
    [students, search]
  );

  const openAdd = () => {
    setEditingStudent(null);
    const newPass = generatePassword();
    setFormData({ firstName: '', lastName: '', username: '', password: newPass, enrollmentDate: getTodayString() });
    setShowModal(true);
    setShowPassword(true);
  };

  const openEdit = (s: Student) => {
    setEditingStudent(s);
    setFormData({ 
      firstName: s.firstName, 
      lastName: s.lastName, 
      username: s.username, 
      password: s.password,
      enrollmentDate: s.enrollmentDate || getTodayString()
    });
    setShowModal(true);
    setShowPassword(false);
  };

  const handleNameChange = (field: 'firstName' | 'lastName', value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-generate username only when adding new student (not editing)
      if (!editingStudent) {
        updated.username = generateUsername(
          field === 'lastName' ? value : prev.lastName,
          field === 'firstName' ? value : prev.firstName
        );
      }
      return updated;
    });
  };

  const regeneratePassword = () => {
    setFormData(prev => ({ ...prev, password: generatePassword() }));
    setShowPassword(true);
  };

  const save = () => {
    if (!formData.firstName || !formData.lastName || !formData.username) {
      alert('Заполните имя, фамилию и логин');
      return;
    }
    if (!formData.password) {
      setFormData(prev => ({ ...prev, password: generatePassword() }));
    }
    if (editingStudent) {
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? { ...s, ...formData } : s));
    } else {
      setStudents(prev => [...prev, { id: `s${Date.now()}`, ...formData }]);
    }
    setShowModal(false);
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    // Clean up all related data for deleted student
    setGrades(prev => prev.filter(g => g.studentId !== id));
    setAttendance(prev => prev.filter(a => a.studentId !== id));
    setTestAttempts(prev => prev.filter(a => a.studentId !== id));
    setTestRetakes(prev => prev.filter(r => r.studentId !== id));
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Ученики</h2>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium">
          <Plus className="w-5 h-5" /> Добавить
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-600">
              <th className="px-4 py-3 text-left">№</th>
              <th className="px-4 py-3 text-left">ФИО</th>
              <th className="px-4 py-3 text-left">Логин</th>
              <th className="px-4 py-3 text-left">Дата прибытия</th>
              <th className="px-4 py-3 text-left">Пароль</th>
              <th className="px-4 py-3 text-center">Действия</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{s.lastName} {s.firstName}</td>
                <td className="px-4 py-3 text-gray-600">{s.username}</td>
                <td className="px-4 py-3 text-gray-600">{formatDateDisplay(s.enrollmentDate)}</td>
                <td className="px-4 py-3 text-gray-600">••••••</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                    <button onClick={() => deleteStudent(s.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scaleIn" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">{editingStudent ? 'Редактировать' : 'Добавить ученика'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Фамилия</label>
                <input type="text" value={formData.lastName} onChange={e => handleNameChange('lastName', e.target.value)}
                  placeholder="Иванов" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Имя</label>
                <input type="text" value={formData.firstName} onChange={e => handleNameChange('firstName', e.target.value)}
                  placeholder="Артём" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Логин <span className="text-gray-400">(генерируется автоматически)</span></label>
                <input type="text" value={formData.username} onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                  placeholder="ivanov.a" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Пароль <span className="text-gray-400">(генерируется автоматически)</span></label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                      placeholder="Пароль" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button onClick={regeneratePassword} className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium whitespace-nowrap">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Дата прибытия в школу</label>
                <input 
                  type="date" 
                  value={formData.enrollmentDate || getTodayString()} 
                  onChange={e => setFormData(p => ({ ...p, enrollmentDate: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500" 
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={save} className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium">
                {editingStudent ? 'Сохранить' : 'Добавить'}
              </button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium">
                Отмена
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Журнал</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScheduleEditMode(!scheduleEditMode)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
              scheduleEditMode 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {scheduleEditMode ? <Save className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
            {scheduleEditMode ? 'Сохранить' : 'Редактировать'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
          className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
        >
          <option value="">Все предметы</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeekStart(prev => {
              const d = new Date(prev);
              d.setDate(d.getDate() - 7);
              return d;
            })}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[200px] text-center">
            {currentWeekStart.getDate()} - {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).getDate()} {MONTH_NAMES_GEN[currentWeekStart.getMonth()]}
          </span>
          <button
            onClick={() => setCurrentWeekStart(prev => {
              const d = new Date(prev);
              d.setDate(d.getDate() + 7);
              return d;
            })}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <button
          onClick={() => setCurrentWeekStart(new Date())}
          className="px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
        >
          Сегодня
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-3">
        {weekDates.map((date, idx) => {
          const dateStr = formatDate(date);
          const dayLessons = lessons.filter(l => l.date === dateStr).sort((a, b) => a.lessonNumber - b.lessonNumber);
          const dow = date.getDay();
          const isWeekend = dow === 0 || dow === 6;
          const isToday = dateStr === getTodayString();
          
          return (
            <div key={idx} className={`min-h-[200px] rounded-2xl border-2 transition-all ${
              isToday ? 'border-primary-300 bg-primary-50/50' : 
              isWeekend ? 'border-gray-100 bg-gray-50/50' : 
              'border-gray-200 bg-white'
            }`}>
              <div className={`p-3 text-center border-b ${
                isToday ? 'bg-primary-100 border-primary-200' : 
                isWeekend ? 'bg-gray-100 border-gray-100' : 
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="text-xs font-medium text-gray-500">{DAY_NAMES[dow === 0 ? 6 : dow - 1]}</div>
                <div className={`text-lg font-bold ${isToday ? 'text-primary-600' : 'text-gray-900'}`}>{date.getDate()}</div>
              </div>
              <div className="p-2 space-y-2">
                {dayLessons.map(lesson => {
                  const entry = diaryEntries.find(e => e.date === dateStr && e.subject === lesson.subject && e.lessonNumber === lesson.lessonNumber);
                  const dayGrades = grades.filter(g => g.date === dateStr && g.subject === lesson.subject && g.lessonNumber === lesson.lessonNumber);
                  const testObj = entry?.testId ? tests.find(t => t.id === entry.testId) : null;
                  
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => handleOpenLessonPage(lesson.subject, dateStr, lesson.lessonNumber)}
                      className="w-full p-2 text-left rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-bold text-gray-400">{lesson.lessonNumber}</span>
                        <span className="text-xs font-semibold text-gray-700 truncate">{lesson.subject}</span>
                      </div>
                      {entry?.topic && (
                        <div className="text-xs text-gray-600 truncate mb-1">{entry.topic}</div>
                      )}
                      {entry?.homework && (
                        <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          {entry.homework}
                        </div>
                      )}
                      {dayGrades.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {dayGrades.slice(0, 3).map((g, i) => (
                            <span key={i} className={`w-5 h-5 rounded-lg text-[10px] font-bold flex items-center justify-center ${
                              g.value === 5 ? 'bg-green-100 text-green-700' :
                              g.value === 4 ? 'bg-blue-100 text-blue-700' :
                              g.value === 3 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>{g.value}</span>
                          ))}
                          {dayGrades.length > 3 && <span className="text-[10px] text-gray-400">+{dayGrades.length - 3}</span>}
                        </div>
                      )}
                      {testObj && (
                        <div className="mt-1 px-1.5 py-0.5 bg-purple-100 rounded text-[10px] font-medium text-purple-700">
                          Тест
                        </div>
                      )}
                    </button>
                  );
                })}
                {dayLessons.length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-4">—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};