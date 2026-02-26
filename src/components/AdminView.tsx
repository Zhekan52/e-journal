import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, useData } from '../context';
import { Schedule } from './Schedule';
import { QuestionEditor } from './QuestionEditor';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  BookOpen, Calendar, ClipboardList, Users, LogOut, Settings, Plus,
  Trash2, Edit2, Search, X, Save, ChevronDown, Eye, EyeOff,
  AlertTriangle, TrendingUp, TrendingDown, FileText,
  BarChart3, Award, ArrowLeft, RefreshCw, ChevronRight, Tag, Info,
  Paperclip, Download, Keyboard, MousePointer2
} from 'lucide-react';
import {
  SUBJECTS, MONTH_NAMES, MONTH_NAMES_GEN, ATTENDANCE_TYPES,
  type Student, type Test, type TestQuestion, type CustomLessonType, type AttendanceRecord,
  formatDate
} from '../data';

type Tab = 'dashboard' | 'schedule' | 'journal' | 'tests' | 'students' | 'lessonTypes';

export const AdminView: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [scheduleEditMode, setScheduleEditMode] = useState(false);
  const [lessonPageParams, setLessonPageParams] = useState<{ subject: string; date: string; lessonNumber: number } | null>(null);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Сводка', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'schedule', label: 'Расписание', icon: <Calendar className="w-5 h-5" /> },
    { id: 'journal', label: 'Журнал', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'tests', label: 'Тесты', icon: <FileText className="w-5 h-5" /> },
    { id: 'students', label: 'Ученики', icon: <Users className="w-5 h-5" /> },
    { id: 'lessonTypes', label: 'Типы уроков', icon: <Tag className="w-5 h-5" /> },
  ];

  const handleOpenLessonPage = (subject: string, date: string, lessonNumber: number) => {
    // Сохраняем параметры в localStorage для использования в компоненте Journal
    localStorage.setItem('open_journal_params', JSON.stringify({ subject, date, lessonNumber }));
    // Переключаемся на вкладку Журнал
    setActiveTab('journal');
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 text-lg">Панель управления</span>
            </div>
            <nav className="flex items-center gap-1 bg-gray-100/50 rounded-xl p-1">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'}`}>
                  {tab.icon}
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100/50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.charAt(0)}
                </div>
                <span className="text-sm text-gray-700 font-medium">{user?.name}</span>
              </div>
              <button onClick={logout} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-red-500">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'schedule' && <Schedule editable={scheduleEditMode} onEditModeChange={setScheduleEditMode} onOpenLessonPage={handleOpenLessonPage} />}
        {activeTab === 'journal' && <Journal />}
        {activeTab === 'tests' && <TestsManager />}
        {activeTab === 'students' && <StudentsManager />}
        {activeTab === 'lessonTypes' && <LessonTypesManager />}
      </main>
    </div>
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
  const today = formatDate(new Date());
  const todayLessons = lessons.filter(l => l.date === today).sort((a, b) => a.lessonNumber - b.lessonNumber);

  const existingStudentIds = new Set(students.map(s => s.id));
  const filteredGrades = grades.filter(g => existingStudentIds.has(g.studentId));
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
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl shadow-blue-500/20">
        <h1 className="text-2xl font-semibold mb-2">Добро пожаловать!</h1>
        <p className="text-blue-100">
          {new Date().getDate()} {MONTH_NAMES_GEN[new Date().getMonth()]} · {students.length} учеников · {todayLessons.length} уроков сегодня
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Учеников</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{students.length}</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Средний балл</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">{avgGrade}</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Оценок</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{filteredGrades.length}</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Пропуски (Н)</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{absentCount}</div>
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

// ==================== GRADE PICKER PORTAL ====================
const GradePickerPortal: React.FC<{
  anchorRect: DOMRect;
  currentGrade?: number;
  onSelect: (v: number) => void;
  onDelete?: () => void;
  onClose: () => void;
}> = ({ anchorRect, currentGrade, onSelect, onDelete, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const widgetW = 200;
  const widgetH = currentGrade ? 90 : 60;
  let top = anchorRect.bottom + 4;
  let left = anchorRect.left + anchorRect.width / 2 - widgetW / 2;
  if (top + widgetH > window.innerHeight) top = anchorRect.top - widgetH - 4;
  if (left < 8) left = 8;
  if (left + widgetW > window.innerWidth - 8) left = window.innerWidth - widgetW - 8;

  return createPortal(
    <div ref={ref} className="fixed z-[100] bg-white rounded-xl shadow-2xl border border-gray-200 p-2 animate-scaleIn"
      style={{ top, left, width: widgetW }}>
      <div className="flex gap-1.5 justify-center">
        {[5, 4, 3, 2].map(v => (
          <button key={v} onClick={() => onSelect(v)}
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
  const [inputMode, setInputMode] = useState<'widget' | 'keyboard'>('widget');
  // Позиция курсора для навигации по таблице (режим клавиатуры)
  const [keyboardPosition, setKeyboardPosition] = useState<{
    studentIndex: number;
    slotIndex: number;
    columnIndex: number; // 0 = основная оценка, 1+ = доп. колонки
  } | null>(null);
  
  const [keyboardTarget, setKeyboardTarget] = useState<{ studentId: string; date: string; columnId?: string; lessonNumber?: number } | null>(null);
  const [gradePickerState, setGradePickerState] = useState<{ rect: DOMRect; studentId: string; date: string; columnId?: string; lessonNumber?: number } | null>(null);
  const [attendancePickerState, setAttendancePickerState] = useState<{ rect: DOMRect; studentId: string; date: string } | null>(null);
  const [popoverDate, setPopoverDate] = useState<string | null>(null);
  const [popoverRect, setPopoverRect] = useState<DOMRect | null>(null);
  const [lessonPageDate, setLessonPageDate] = useState<string | null>(null);
  const [lessonPageLessonNum, setLessonPageLessonNum] = useState<number>(1);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Обработка ввода с клавиатуры
  useEffect(() => {
    if (inputMode !== 'keyboard') return;

    // Функция для получения количества колонок в слоте
    const getColumnCountForSlot = (slotIdx: number) => {
      if (slotIdx < 0 || slotIdx >= allSlots.length) return 1;
      const slot = allSlots[slotIdx];
      const cols = getColumnsForSlot(slot.date, slot.lessonNumber);
      return 1 + cols.length; // основная оценка + доп. колонки
    };

    // Функция для перехода к следующей позиции
    const moveToPosition = (studentIdx: number, slotIdx: number, colIdx: number) => {
      const totalStudents = sortedStudents.length;
      const totalSlots = allSlots.length;
      
      if (studentIdx < 0 || studentIdx >= totalStudents || slotIdx < 0 || slotIdx >= totalSlots) return;
      
      const colCount = getColumnCountForSlot(slotIdx);
      if (colIdx < 0 || colIdx >= colCount) return;
      
      setKeyboardPosition({ studentIndex: studentIdx, slotIndex: slotIdx, columnIndex: colIdx });
      
      // Также обновляем keyboardTarget для визуальной подсветки
      const slot = allSlots[slotIdx];
      const student = sortedStudents[studentIdx];
      let columnId: string | undefined;
      
      if (colIdx > 0) {
        const cols = getColumnsForSlot(slot.date, slot.lessonNumber);
        if (cols[colIdx - 1]) {
          columnId = cols[colIdx - 1].id;
        }
      }
      
      setKeyboardTarget({
        studentId: student.id,
        date: slot.date,
        lessonNumber: slot.lessonNumber,
        columnId
      });
    };

    // Функция для перемещения на одну ячейку
    const moveByOffset = (deltaStudent: number, deltaSlot: number, deltaCol: number) => {
      if (!keyboardPosition) {
        // Инициализация на первой позиции
        moveToPosition(0, 0, 0);
        return;
      }

      let newStudentIdx = keyboardPosition.studentIndex + deltaStudent;
      let newSlotIdx = keyboardPosition.slotIndex + deltaSlot;
      let newColIdx = keyboardPosition.columnIndex + deltaCol;

      const totalStudents = sortedStudents.length;
      const totalSlots = allSlots.length;

      // Обработка перехода по колонкам
      if (newColIdx < 0) {
        // Влево за пределы - переходим на предыдущий слот
        newColIdx = getColumnCountForSlot(newSlotIdx - 1) - 1;
        newSlotIdx--;
      } else if (newColIdx >= getColumnCountForSlot(newSlotIdx)) {
        // Вправо за пределы - переходим на следующий слот
        newColIdx = 0;
        newSlotIdx++;
      }

      // Обработка перехода по слотам
      if (newSlotIdx < 0) {
        // Вверх за пределы - ничего не делаем
        return;
      } else if (newSlotIdx >= totalSlots) {
        // Вниз за пределы - ничего не делаем
        return;
      }

      // Обработка перехода по ученикам
      if (newStudentIdx < 0) {
        // Вверх за пределы
        return;
      } else if (newStudentIdx >= totalStudents) {
        // Вниз за пределы
        return;
      }

      moveToPosition(newStudentIdx, newSlotIdx, newColIdx);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      
      // Если есть активная позиция - обрабатываем навигацию
      if (keyboardPosition) {
        if (key === 'ArrowUp') {
          e.preventDefault();
          moveByOffset(-1, 0, 0); // Вверх - предыдущий ученик
          return;
        } else if (key === 'ArrowDown') {
          e.preventDefault();
          moveByOffset(1, 0, 0); // Вниз - следующий ученик
          return;
        } else if (key === 'ArrowLeft') {
          e.preventDefault();
          moveByOffset(0, 0, -1); // Влево - предыдущая колонка/слот
          return;
        } else if (key === 'ArrowRight') {
          e.preventDefault();
          moveByOffset(0, 0, 1); // Вправо - следующая колонка/слот
          return;
        } else if (key === 'Enter') {
          e.preventDefault();
          // Enter - переход на следующего ученика (как при выставлении оценки)
          const currentStudent = sortedStudents[keyboardPosition.studentIndex];
          const currentSlot = allSlots[keyboardPosition.slotIndex];
          let columnId: string | undefined;
          
          if (keyboardPosition.columnIndex > 0) {
            const cols = getColumnsForSlot(currentSlot.date, currentSlot.lessonNumber);
            if (cols[keyboardPosition.columnIndex - 1]) {
              columnId = cols[keyboardPosition.columnIndex - 1].id;
            }
          }
          
          // Если уже есть оценка - удаляем её, иначе ничего не делаем
          const existingGrade = getGrade(currentStudent.id, currentSlot.date, columnId, currentSlot.lessonNumber);
          if (existingGrade) {
            deleteGrade(currentStudent.id, currentSlot.date, columnId, currentSlot.lessonNumber);
          }
          
          // Переходим на следующего ученика
          moveByOffset(1, 0, 0);
          return;
        } else if (key === 'Escape') {
          e.preventDefault();
          setKeyboardPosition(null);
          setKeyboardTarget(null);
          return;
        }
      }

      // Обработка ввода оценок (только если есть позиция или цель)
      const target = keyboardTarget || (keyboardPosition ? {
        studentId: sortedStudents[keyboardPosition.studentIndex].id,
        date: allSlots[keyboardPosition.slotIndex].date,
        lessonNumber: allSlots[keyboardPosition.slotIndex].lessonNumber,
        columnId: keyboardPosition && keyboardPosition.columnIndex > 0 
          ? getColumnsForSlot(allSlots[keyboardPosition.slotIndex].date, allSlots[keyboardPosition.slotIndex].lessonNumber)[keyboardPosition.columnIndex - 1]?.id
          : undefined
      } : null);

      if (!target) return;

      if (['2', '3', '4', '5'].includes(key)) {
        e.preventDefault();
        const value = parseInt(key);
        setGrade(target.studentId, target.date, value, target.columnId, target.lessonNumber);
        
        // После ввода оценки - переходим на следующего ученика
        if (keyboardPosition) {
          moveByOffset(1, 0, 0);
        } else {
          // Если позиции нет - создаём её
          const studentIdx = sortedStudents.findIndex(s => s.id === target.studentId);
          const slotIdx = allSlots.findIndex(s => s.date === target.date && s.lessonNumber === target.lessonNumber);
          if (studentIdx >= 0 && slotIdx >= 0) {
            moveToPosition(studentIdx, slotIdx, target.columnId ? 1 : 0);
          }
        }
      } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
        e.preventDefault();
        deleteGrade(target.studentId, target.date, target.columnId, target.lessonNumber);
        if (keyboardPosition) {
          moveByOffset(1, 0, 0);
        }
      } else if (key === 'Escape') {
        e.preventDefault();
        setKeyboardTarget(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [inputMode, keyboardPosition, sortedStudents, allSlots]);

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

  // Each lesson = one slot in the journal (date + lessonNumber)
  const allSlots = useMemo(() => {
    return lessons
      .filter(l => l.subject === selectedSubject)
      .map(l => ({ date: l.date, lessonNumber: l.lessonNumber, key: `${l.date}_${l.lessonNumber}` }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.lessonNumber - b.lessonNumber);
  }, [lessons, selectedSubject]);

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

  const setGrade = (studentId: string, date: string, value: number, columnId?: string, lessonNumber?: number) => {
    setGrades(prev => {
      const existing = prev.find(g => g.studentId === studentId && g.date === date && g.subject === selectedSubject
        && (columnId ? g.columnId === columnId : !g.columnId)
        && (lessonNumber !== undefined ? g.lessonNumber === lessonNumber : true));
      if (existing) return prev.map(g => g.id === existing.id ? { ...g, value } : g);
      return [...prev, { id: `g${Date.now()}${Math.random().toString(36).slice(2, 6)}`, studentId, subject: selectedSubject, value, date, lessonNumber, columnId }];
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
      lessons.some(l => l.date === g.date && l.subject === selectedSubject)
    );
    return sg.length > 0 ? sg.reduce((a, g) => a + g.value, 0) / sg.length : 0;
  };

  const getStudentTrend = (studentId: string) => {
    if (!grades || !lessons) return 0;
    const sg = grades.filter(g =>
      g.studentId === studentId &&
      g.subject === selectedSubject &&
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
          <button onClick={() => { setLessonPageDate(null); setKeyboardPosition(null); setKeyboardTarget(null); }} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4 font-medium">
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
          <button onClick={() => { setLessonPageDate(null); setKeyboardPosition(null); setKeyboardTarget(null); }} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
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
                }} className="w-full px-4 py-3 pr-12 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all placeholder-gray-400" placeholder="ДЗ..." />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {entry?.attachment && (
                    <a href={entry.attachment.url} download={entry.attachment.name} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Скачать файл">
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <label className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" title="Прикрепить файл">
                    <Paperclip className="w-4 h-4" />
                    <input type="file" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        const ent = getOrCreateDiaryEntry(lessonPageDate, lessonPageLessonNum);
                        if (ent) {
                          setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, attachment: { name: file.name, url } } : de));
                        }
                      }
                      e.target.value = '';
                    }} />
                  </label>
                  {entry?.attachment && (
                    <button onClick={() => {
                      const ent = getOrCreateDiaryEntry(lessonPageDate, lessonPageLessonNum);
                      if (ent) {
                        setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, attachment: undefined } : de));
                      }
                    }} className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Удалить файл">
                      <X className="w-4 h-4" />
                    </button>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Тест</label>
              <select value={entry?.testId || ''} onChange={e => {
                const ent = getOrCreateDiaryEntry(lessonPageDate, lessonPageLessonNum);
                if (ent) {
                  const prevTestId = ent.testId;
                  setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, testId: e.target.value || undefined, testType: e.target.value ? 'real' as const : undefined } : de));
                  
                  // При назначении теста создаем колонку, при удалении - удаляем
                  if (e.target.value && !prevTestId) {
                    const hasCol = journalColumns.some(c => c.date === lessonPageDate && c.subject === selectedSubject && c.type === 'test' && (c.lessonNumber === lessonPageLessonNum || (!c.lessonNumber && lessonPageLessonNum === 0)));
                    if (!hasCol) {
                      const newCol = { id: `jc${Date.now()}`, date: lessonPageDate, subject: selectedSubject, lessonNumber: lessonPageLessonNum, type: 'test' };
                      setJournalColumns(prev => [...prev, newCol]);
                    }
                  } else if (!e.target.value && prevTestId) {
                    // Удаляем колонку теста и связанные оценки
                    const testCol = journalColumns.find(c => c.date === lessonPageDate && c.subject === selectedSubject && c.type === 'test' && (c.lessonNumber === lessonPageLessonNum || (!c.lessonNumber && lessonPageLessonNum === 0)));
                    if (testCol && setGrades) {
                      setGrades(prev => prev.filter(g => !(g.date === lessonPageDate && g.subject === selectedSubject && g.columnId === testCol.id)));
                    }
                    setJournalColumns(prev => prev.filter(c => !(c.date === lessonPageDate && c.subject === selectedSubject && c.type === 'test' && (c.lessonNumber === lessonPageLessonNum || (!c.lessonNumber && lessonPageLessonNum === 0)))));
                  }
                }
              }} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none cursor-pointer">
                <option value="">Без теста</option>
                {tests && Array.isArray(tests) && tests.filter(t => t.subject === selectedSubject).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${entry?.checkHomework ? 'bg-primary-500' : 'bg-gray-300'}`}>
                <input type="checkbox" checked={entry?.checkHomework || false} onChange={e => {
                  const ent = getOrCreateDiaryEntry(lessonPageDate, lessonPageLessonNum);
                  if (ent) {
                    setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, checkHomework: e.target.checked } : de));
                    if (e.target.checked) {
                      const hasCol = journalColumns.some(c => c.date === lessonPageDate && c.subject === selectedSubject && c.type === 'homework' && (c.lessonNumber === lessonPageLessonNum || !c.lessonNumber));
                      if (!hasCol) setJournalColumns(prev => [...prev, { id: `jc${Date.now()}`, date: lessonPageDate, subject: selectedSubject, lessonNumber: lessonPageLessonNum, type: 'homework' }]);
                    } else {
                      setJournalColumns(prev => prev.filter(c => !(c.date === lessonPageDate && c.subject === selectedSubject && c.type === 'homework' && (c.lessonNumber === lessonPageLessonNum || !c.lessonNumber))));
                    }
                  }
                }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ${entry?.checkHomework ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-colors">Проверять ДЗ (колонка)</span>
            </label>

            <div className="flex gap-2">
              {cols.map(c => (
                <div key={c.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  {c.type === 'homework' ? 'ДЗ' : c.type === 'test' ? 'Тест' : 'Доп.'}
                  <button onClick={() => removeColumn(c.id)} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                </div>
              ))}
              <button onClick={() => addColumn(lessonPageDate, lessonPageLessonNum)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                <Plus className="w-3 h-3" /> Колонка
              </button>
            </div>
          </div>
        </div>

        {assignedTest && entry && (
          <TestResultsSection test={assignedTest} date={lessonPageDate} subject={selectedSubject} students={sortedStudents} testAttempts={testAttempts} testRetakes={testRetakes} setTestRetakes={setTestRetakes} setTestAttempts={setTestAttempts} grades={grades} setGrades={setGrades} journalColumns={journalColumns} lessonNumber={lessonPageLessonNum} testAssignments={testAssignments} setTestAssignments={setTestAssignments} />
        )}

        <div className="glass rounded-2xl shadow-soft overflow-hidden border border-white/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="sticky left-0 z-10 bg-gray-50/80 px-4 py-3 text-left font-semibold w-48 min-w-[180px] border-r border-gray-200">Ученик</th>
                  
                  {last5Dates.map(d => (
                    <th key={d} className="px-2 py-3 text-center font-semibold min-w-[50px] border-r border-gray-200 text-gray-400">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px]">{MONTH_NAMES[parseInt(d.split('-')[1]) - 1]?.slice(0, 3)}</span>
                        <span className="text-xs font-bold">{parseInt(d.split('-')[2])}</span>
                      </div>
                    </th>
                  ))}

                  <th className="px-3 py-3 text-center font-semibold min-w-[60px] border-r border-gray-200 bg-primary-50 text-primary-700">
                    Осн.
                  </th>

                  {entry?.checkHomework && (
                    <th className="px-3 py-3 text-center font-semibold min-w-[60px] border-r border-gray-200">
                      ДЗ
                    </th>
                  )}

                  {cols.filter(c => c.type !== 'homework').map(c => (
                    <th key={c.id} className="px-3 py-3 text-center font-semibold min-w-[60px] border-r border-gray-200 bg-blue-50 text-blue-700">
                      {c.type === 'test' ? 'Тест' : 'Доп'}
                    </th>
                  ))}

                  <th className="px-3 py-3 text-center font-semibold min-w-[60px] border-r border-gray-200">Ср.</th>
                  <th className="px-2 py-3 text-center font-semibold min-w-[40px] border-r border-gray-200">Тренд</th>
                  <th className="px-2 py-3 text-center font-semibold min-w-[40px]">⚠</th>
                </tr>
              </thead>
              <tbody>
                {lpStudentGrades.map((s, idx) => {
                  const mainGrade = getGrade(s.id, lessonPageDate, undefined, lessonPageLessonNum);
                  // Get all columns for this lesson (including homework)
                  const allColsForLesson = getColumnsForSlot(lessonPageDate, lessonPageLessonNum);
                  const hwCol = entry?.checkHomework ? allColsForLesson.find(c => c.type === 'homework') : null;
                  const hwGrade = hwCol ? getGrade(s.id, lessonPageDate, hwCol.id, lessonPageLessonNum) : null;

                  return (
                    <tr key={s.id} className="border-b-2 border-gray-400 hover:bg-gray-50/60 transition-colors">
                      <td className="sticky left-0 z-10 bg-white/0 hover:bg-white/40 px-4 py-2 font-medium text-gray-900 text-xs border-r border-gray-300 whitespace-nowrap backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs w-4">{idx + 1}.</span>
                          <span>{s.lastName} {s.firstName}</span>
                        </div>
                      </td>

                      {last5Dates.map(d => {
                        const g = grades.find(grade => grade.studentId === s.id && grade.date === d && grade.subject === selectedSubject && !grade.columnId);
                        const att = attendance.find(a => a.studentId === s.id && a.date === d && a.subject === selectedSubject);
                        const at = att ? ATTENDANCE_TYPES.find(at => at.value === att.type) : null;
                        return (
                          <td key={d} className="px-1 py-2 text-center border-r border-gray-300">
                            {att ? (
                              <span className={`inline-block w-7 h-7 leading-7 rounded-md text-[10px] font-bold ${at?.bgColor} ${at?.color}`}>
                                {att.type}
                              </span>
                            ) : g ? (
                              <span className={`inline-block w-7 h-7 leading-7 rounded-md text-[10px] font-bold ${
                                g.value === 5 ? 'bg-green-50 text-green-600' :
                                g.value === 4 ? 'bg-blue-50 text-blue-600' :
                                g.value === 3 ? 'bg-yellow-50 text-yellow-600' :
                                'bg-red-50 text-red-600'
                              }`}>
                                {g.value}
                              </span>
                            ) : <span className="text-gray-300">·</span>}
                          </td>
                        );
                      })}

                      <td className="px-1 py-2 text-center border-r border-gray-300">
                        {(() => {
                          const att = attendance.find(a => a.studentId === s.id && a.date === lessonPageDate && a.subject === selectedSubject);
                          const at = att ? ATTENDANCE_TYPES.find(at => at.value === att.type) : null;
                          // Если есть посещаемость — показываем её на всю клетку, иначе оценку
                          const showAttendance = !!att;
                          // Блокируем кнопку если есть посещаемость (нельзя ставить оценку)
                          const isBlocked = showAttendance;
                          return (
                            <button
                              onClick={e => {
                                if (!isBlocked) {
                                  if (inputMode === 'keyboard') {
                                    setKeyboardTarget({ studentId: s.id, date: lessonPageDate, lessonNumber: lessonPageLessonNum });
                                  } else {
                                    setGradePickerState({ rect: e.currentTarget.getBoundingClientRect(), studentId: s.id, date: lessonPageDate, lessonNumber: lessonPageLessonNum });
                                  }
                                }
                              }}
                              disabled={isBlocked}
                              className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${isBlocked ? 'cursor-not-allowed opacity-70' : ''} ${
                                inputMode === 'keyboard' && (
                                  (keyboardTarget?.studentId === s.id && keyboardTarget?.date === lessonPageDate && keyboardTarget?.lessonNumber === lessonPageLessonNum && !keyboardTarget?.columnId) ||
                                  (keyboardPosition?.studentIndex === idx && keyboardPosition?.slotIndex === allSlots.findIndex(sl => sl.date === lessonPageDate && sl.lessonNumber === lessonPageLessonNum) && keyboardPosition?.columnIndex === 0)
                                )
                                  ? 'ring-2 ring-primary-500 ring-offset-1 bg-primary-50 text-primary-700'
                                  : showAttendance ? `${at?.bgColor} ${at?.color}` : mainGrade ?
                                    (mainGrade.value === 5 ? 'bg-green-100 text-green-700' : mainGrade.value === 4 ? 'bg-blue-100 text-blue-700' : mainGrade.value === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border-2 border-dashed border-gray-400'
                              }`}
                              title={isBlocked ? 'Нельзя поставить оценку при отсутствии' : ''}
                            >
                              {showAttendance ? att?.type : (mainGrade?.value || '')}
                            </button>
                          );
                        })()}
                      </td>

                      {entry?.checkHomework && (
                        <td className="px-1 py-2 text-center border-r border-gray-300">
                          {(() => {
                            const att = attendance.find(a => a.studentId === s.id && a.date === lessonPageDate && a.subject === selectedSubject);
                            const isBlocked = !!att;
                            return (
                              <button 
                                onClick={e => {
                                  if (!isBlocked) {
                                    if (inputMode === 'keyboard') {
                                      setKeyboardTarget({ studentId: s.id, date: lessonPageDate, columnId: hwCol?.id, lessonNumber: lessonPageLessonNum });
                                    } else {
                                      setGradePickerState({ rect: e.currentTarget.getBoundingClientRect(), studentId: s.id, date: lessonPageDate, columnId: hwCol?.id, lessonNumber: lessonPageLessonNum });
                                    }
                                  }
                                }}
                                disabled={isBlocked}
                                className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${isBlocked ? 'cursor-not-allowed opacity-70' : ''} ${
                                  inputMode === 'keyboard' && (
                                    (keyboardTarget?.studentId === s.id && keyboardTarget?.date === lessonPageDate && keyboardTarget?.columnId === hwCol?.id && keyboardTarget?.lessonNumber === lessonPageLessonNum) ||
                                    (keyboardPosition?.studentIndex === idx && keyboardPosition?.slotIndex === allSlots.findIndex(sl => sl.date === lessonPageDate && sl.lessonNumber === lessonPageLessonNum) && 
                                      hwCol && keyboardPosition?.columnIndex === 1 + allColsForLesson.findIndex(c => c.id === hwCol.id))
                                  )
                                    ? 'ring-2 ring-primary-500 ring-offset-1 bg-primary-50 text-primary-700'
                                    : hwGrade ?
                                      (hwGrade.value === 5 ? 'bg-green-100 text-green-700' : hwGrade.value === 4 ? 'bg-blue-100 text-blue-700' : hwGrade.value === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border-2 border-dashed border-gray-400'
                                }`}
                                title={isBlocked ? 'Нельзя поставить оценку при отсутствии' : ''}
                              >
                                {hwGrade?.value || ''}
                              </button>
                            );
                          })()}
                        </td>
                      )}

                      {cols.filter(c => c.type !== 'homework').map(c => {
                        const g = getGrade(s.id, lessonPageDate, c.id, lessonPageLessonNum);
                        const att = attendance.find(a => a.studentId === s.id && a.date === lessonPageDate && a.subject === selectedSubject);
                        const isBlocked = !!att;
                        return (
                          <td key={c.id} className="px-1 py-2 text-center border-r border-gray-300">
                            <button
                              onClick={e => {
                                if (!isBlocked) {
                                  if (inputMode === 'keyboard') {
                                    setKeyboardTarget({ studentId: s.id, date: lessonPageDate, columnId: c.id, lessonNumber: lessonPageLessonNum });
                                  } else {
                                    setGradePickerState({ rect: e.currentTarget.getBoundingClientRect(), studentId: s.id, date: lessonPageDate, columnId: c.id, lessonNumber: lessonPageLessonNum });
                                  }
                                }
                              }}
                              disabled={isBlocked}
                              className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${isBlocked ? 'cursor-not-allowed opacity-70' : ''} ${
                                inputMode === 'keyboard' && (
                                  (keyboardTarget?.studentId === s.id && keyboardTarget?.date === lessonPageDate && keyboardTarget?.columnId === c.id && keyboardTarget?.lessonNumber === lessonPageLessonNum) ||
                                  (keyboardPosition?.studentIndex === idx && keyboardPosition?.slotIndex === allSlots.findIndex(sl => sl.date === lessonPageDate && sl.lessonNumber === lessonPageLessonNum) &&
                                    (entry?.checkHomework ? keyboardPosition?.columnIndex === 1 + allColsForLesson.filter(col => col.type !== 'homework').findIndex(col => col.id === c.id) + 1 : 
                                      keyboardPosition?.columnIndex === 1 + allColsForLesson.findIndex(col => col.id === c.id)))
                                )
                                  ? 'ring-2 ring-primary-500 ring-offset-1 bg-primary-50 text-primary-700'
                                  : g ?
                                    (g.value === 5 ? 'bg-green-100 text-green-700' : g.value === 4 ? 'bg-blue-100 text-blue-700' : g.value === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border-2 border-dashed border-gray-400'
                              }`}
                              title={isBlocked ? 'Нельзя поставить оценку при отсутствии' : ''}
                            >
                              {g?.value || ''}
                            </button>
                          </td>
                        );
                      })}

                      <td className="px-2 py-2 text-center border-r border-gray-300 font-bold text-gray-700">
                        {s.avg > 0 ? s.avg.toFixed(1) : '—'}
                      </td>
                      <td className="px-2 py-2 text-center border-r border-gray-300">
                        {s.trend === 1 && <TrendingUp className="w-4 h-4 text-green-500 mx-auto" />}
                        {s.trend === -1 && <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />}
                        {s.trend === 0 && <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {allSlots.length > 0 && (s.last3WithoutGrade >= 3 || s.hasNoGradesAtAll) && (
                          <span title={s.hasNoGradesAtAll ? 'Нет оценок' : `Не спрашивали ${s.last3WithoutGrade} из последних 3 уроков`}>
                            <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {gradePickerState && (
          <GradePickerPortal
            anchorRect={gradePickerState.rect}
            currentGrade={getGrade(gradePickerState.studentId, gradePickerState.date, gradePickerState.columnId, gradePickerState.lessonNumber)?.value}
            onSelect={v => { setGrade(gradePickerState.studentId, gradePickerState.date, v, gradePickerState.columnId, gradePickerState.lessonNumber); setGradePickerState(null); }}
            onDelete={() => { deleteGrade(gradePickerState.studentId, gradePickerState.date, gradePickerState.columnId, gradePickerState.lessonNumber); setGradePickerState(null); }}
            onClose={() => setGradePickerState(null)}
          />
        )}
      </div>
    );
  }

  // ==================== MAIN JOURNAL VIEW ====================
  return (
    <div className="animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500">
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
            {(['grades', 'topics', 'attendance'] as const).map(tab => (
              <button key={tab} onClick={() => setJournalTab(tab)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${journalTab === tab ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {tab === 'grades' ? 'Оценки' : tab === 'topics' ? 'Темы и ДЗ' : 'Посещаемость'}
              </button>
            ))}
          </div>
          {journalTab === 'grades' && (
            <>
              <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => { setInputMode('widget'); setKeyboardTarget(null); setKeyboardPosition(null); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    inputMode === 'widget'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Ввод виджетом"
                >
                  <MousePointer2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Виджет</span>
                </button>
                <button
                  onClick={() => setInputMode('keyboard')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    inputMode === 'keyboard'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Ввод с клавиатуры"
                >
                  <Keyboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Клавиатура</span>
                </button>
              </div>
              <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Settings className="w-5 h-5 text-gray-500" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Settings only for grades tab */}
      {showSettings && journalTab === 'grades' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 animate-fadeIn">
          <h4 className="font-medium text-gray-900 mb-3">Настройки журнала</h4>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-10 h-6 rounded-full transition-all ${showTrend ? 'bg-primary-600' : 'bg-gray-300'} relative`}
                onClick={() => setShowTrend(!showTrend)}>
                <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${showTrend ? 'left-[18px]' : 'left-0.5'}`} />
              </div>
              <span className="text-sm text-gray-700">Тренд</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-10 h-6 rounded-full transition-all ${showNotAsked ? 'bg-primary-600' : 'bg-gray-300'} relative`}
                onClick={() => setShowNotAsked(!showNotAsked)}>
                <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${showNotAsked ? 'left-[18px]' : 'left-0.5'}`} />
              </div>
              <span className="text-sm text-gray-700">Давно не спрашивали</span>
            </label>
          </div>
        </div>
      )}

      {/* GRADES TAB */}
      {journalTab === 'grades' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {/* Month row */}
                {monthGroups.length > 0 && (
                  <tr className="bg-amber-100">
                    <th className="sticky left-0 z-20 bg-amber-100 w-[48px] min-w-[48px] border-b border-r border-amber-300" />
                    <th className="sticky left-[48px] z-20 bg-amber-100 min-w-[140px] border-b border-r border-amber-300" />
                    {monthGroups.map((mg, i) => {
                      const totalCols = mg.slots.reduce((sum: number, sl) => sum + 1 + getColumnsForSlot(sl.date, sl.lessonNumber).length, 0);
                      return (
                        <th key={i} colSpan={totalCols} className="px-2 py-2 text-center font-semibold text-amber-900 border-b border-r border-amber-300 text-xs uppercase">
                          {mg.month}
                        </th>
                      );
                    })}
                    <th className="px-3 py-2 border-b border-amber-300" />
                    {showTrend && <th className="border-b border-amber-300" />}
                    {showNotAsked && <th className="border-b border-amber-300" />}
                  </tr>
                )}
                {/* Date + lesson number row */}
                <tr className="bg-gray-100">
                  <th className="sticky left-0 z-20 bg-gray-100 px-2 py-2 text-xs font-medium text-gray-600 border-b border-r border-gray-300 w-[48px] min-w-[48px]">№</th>
                  <th className="sticky left-[48px] z-20 bg-gray-100 px-3 py-2 text-left text-xs font-medium text-gray-600 border-b border-r border-gray-300 min-w-[140px]">ФИ</th>
                  {allSlots.map(sl => {
                    const cols = getColumnsForSlot(sl.date, sl.lessonNumber);
                    const totalCols = 1 + cols.length;
                    const lt = getLessonType(sl.date, sl.lessonNumber);
                    const ltType = lt ? customLessonTypes.find(c => c.value === lt.type) : null;
                    // Count how many slots share same date
                    const slotsOnDate = allSlots.filter(s => s.date === sl.date);
                    const showLessonNum = slotsOnDate.length > 1;
                    return (
                      <th key={sl.key} colSpan={totalCols} className="px-1 py-1 text-center border-b border-r border-gray-300 min-w-[44px] relative">
                        <button onClick={(e) => {
                          if (popoverDate === sl.key) {
                            setPopoverDate(null);
                            setPopoverRect(null);
                          } else {
                            setPopoverDate(sl.key);
                            setPopoverRect(e.currentTarget.getBoundingClientRect());
                          }
                        }}
                          className="text-xs font-medium text-gray-700 hover:text-primary-600 transition-colors">
                          {parseInt(sl.date.split('-')[2])}
                          <ChevronDown className={`w-3 h-3 inline ml-0.5 transition-transform ${popoverDate === sl.key ? 'rotate-180' : ''}`} />
                        </button>
                        {showLessonNum && (
                          <div className="text-[9px] font-bold text-primary-600 bg-primary-100 rounded px-1 mt-0.5">
                            Ур. {sl.lessonNumber}
                          </div>
                        )}
                        {ltType && (
                          <div className={`text-[9px] font-bold rounded px-1 mt-0.5 ${ltType.color}`}>{ltType.short}</div>
                        )}
                      </th>
                    );
                  })}
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 border-b border-gray-300 min-w-[56px]">Ср.</th>
                  {showTrend && <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-b border-gray-300 w-10">↕</th>}
                  {showNotAsked && <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-b border-gray-300 w-10">⚠</th>}
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student, idx) => {
                  const avg = getStudentAvg(student.id);
                  const trend = getStudentTrend(student.id);
                  const lastDate = getLastGradeDate(student.id);
                  const daysSince = lastDate ? Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000) : 999;
                  // Проверяем последние 3 урока без оценки
                  const last3Slots = [...allSlots].sort((a, b) => b.date.localeCompare(a.date) || b.lessonNumber - a.lessonNumber).slice(0, 3);
                  const last3WithoutGrade = last3Slots.filter(sl => {
                    const mainGrade = getGrade(student.id, sl.date, undefined, sl.lessonNumber);
                    const cols = getColumnsForSlot(sl.date, sl.lessonNumber);
                    const hasAnyGrade = mainGrade || cols.some(c => getGrade(student.id, sl.date, c.id, sl.lessonNumber));
                    return !hasAnyGrade;
                  }).length;
                  const hasNoGradesAtAll = avg === 0;

                  return (
                    <tr key={student.id} className="border-b border-gray-300 hover:bg-gray-50/60">
                      <td className="sticky left-0 z-10 bg-white px-2 py-1.5 text-center text-xs text-gray-500 border-r border-gray-300 w-[48px]">{idx + 1}</td>
                      <td className="sticky left-[48px] z-10 bg-white px-3 py-1.5 font-medium text-gray-900 text-xs border-r border-gray-300 whitespace-nowrap">{student.lastName} {student.firstName}</td>
                      {allSlots.map(sl => {
                        const cols = getColumnsForSlot(sl.date, sl.lessonNumber);
                        const mainGrade = getGrade(student.id, sl.date, undefined, sl.lessonNumber);
                        const att = getAttendanceMark(student.id, sl.date);
                        const at = att ? ATTENDANCE_TYPES.find(a => a.value === att.type) : null;
                        // Если есть посещаемость — показываем её на всю клетку, иначе оценку
                        const showAttendance = !!att;
                        // Блокируем кнопку если есть посещаемость (нельзя ставить оценку)
                        const isBlocked = showAttendance;
                        return (
                          <React.Fragment key={sl.key}>
                            <td className="px-0.5 py-0.5 text-center border-r border-gray-300">
                              <button 
                                onClick={e => {
                                  if (!isBlocked) {
                                    if (inputMode === 'keyboard') {
                                      setKeyboardTarget({ studentId: student.id, date: sl.date, lessonNumber: sl.lessonNumber });
                                    } else {
                                      setGradePickerState({ rect: e.currentTarget.getBoundingClientRect(), studentId: student.id, date: sl.date, lessonNumber: sl.lessonNumber });
                                    }
                                  }
                                }}
                                disabled={isBlocked}
                                className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${isBlocked ? 'cursor-not-allowed opacity-70' : ''} ${
                                  inputMode === 'keyboard' && (
                                    (keyboardTarget?.studentId === student.id && keyboardTarget?.date === sl.date && keyboardTarget?.lessonNumber === sl.lessonNumber && !keyboardTarget?.columnId) ||
                                    (keyboardPosition?.studentIndex === idx && keyboardPosition?.slotIndex === allSlots.findIndex(s => s.key === sl.key) && keyboardPosition?.columnIndex === 0)
                                  )
                                    ? 'ring-2 ring-primary-500 ring-offset-1 bg-primary-50 text-primary-700'
                                    : showAttendance ? `${at?.bgColor} ${at?.color}` : mainGrade ?
                                      (mainGrade.value === 5 ? 'bg-green-100 text-green-700' : mainGrade.value === 4 ? 'bg-blue-100 text-blue-700' : mainGrade.value === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')
                                      : 'hover:bg-gray-200 text-gray-400 border-2 border-dashed border-gray-400'
                                }`}
                                title={isBlocked ? 'Нельзя поставить оценку при отсутствии' : ''}
                              >
                                {showAttendance ? att?.type : (mainGrade?.value || '')}
                              </button>
                            </td>
                            {cols.map(c => {
                              const g = getGrade(student.id, sl.date, c.id, sl.lessonNumber);
                              return (
                                <td key={c.id} className="px-0.5 py-0.5 text-center border-r border-gray-300">
                                  <button 
                                    onClick={e => {
                                      if (!isBlocked) {
                                        if (inputMode === 'keyboard') {
                                          setKeyboardTarget({ studentId: student.id, date: sl.date, columnId: c.id, lessonNumber: sl.lessonNumber });
                                        } else {
                                          setGradePickerState({ rect: e.currentTarget.getBoundingClientRect(), studentId: student.id, date: sl.date, columnId: c.id, lessonNumber: sl.lessonNumber });
                                        }
                                      }
                                    }}
                                    disabled={isBlocked}
                                    className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${isBlocked ? 'cursor-not-allowed opacity-70' : ''} ${
                                      inputMode === 'keyboard' && (
                                        (keyboardTarget?.studentId === student.id && keyboardTarget?.date === sl.date && keyboardTarget?.columnId === c.id && keyboardTarget?.lessonNumber === sl.lessonNumber) ||
                                        (keyboardPosition?.studentIndex === idx && keyboardPosition?.slotIndex === allSlots.findIndex(s => s.key === sl.key) &&
                                          keyboardPosition?.columnIndex === 1 + cols.findIndex(col => col.id === c.id))
                                      )
                                        ? 'ring-2 ring-primary-500 ring-offset-1 bg-primary-50 text-primary-700'
                                        : g ?
                                          (g.value === 5 ? 'bg-green-100 text-green-700' : g.value === 4 ? 'bg-blue-100 text-blue-700' : g.value === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')
                                          : 'hover:bg-gray-200 text-gray-400 border-2 border-dashed border-gray-400'
                                    }`}
                                    title={isBlocked ? 'Нельзя поставить оценку при отсутствии' : ''}
                                  >
                                    {g?.value || ''}
                                  </button>
                                </td>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                      <td className="px-2 py-1.5 text-center border-gray-300">
                        {avg > 0 ? (
                          <span className={`font-bold text-sm ${avg >= 4.5 ? 'text-green-600' : avg >= 3.5 ? 'text-blue-600' : avg >= 2.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {avg.toFixed(1)}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      {showTrend && (
                        <td className="px-2 py-1.5 text-center">
                          {trend === 1 && <TrendingUp className="w-4 h-4 text-green-500 mx-auto" />}
                          {trend === -1 && <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />}
                        </td>
                      )}
                      {showNotAsked && (
                        <td className="px-2 py-1.5 text-center">
                          {allDates.length > 0 && (last3WithoutGrade >= 3 || hasNoGradesAtAll) && (
                            <span title={hasNoGradesAtAll ? 'Нет оценок' : `Не спрашивали ${last3WithoutGrade} из последних 3 уроков`}>
                              <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TOPICS TAB */}
      {journalTab === 'topics' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-xs text-gray-700">
                <th className="px-3 py-2 text-left w-10">№</th>
                <th className="px-3 py-2 text-left w-28">Дата</th>
                <th className="px-3 py-2 text-left w-28">Тип урока</th>
                <th className="px-3 py-2 text-left">Тема урока</th>
                <th className="px-3 py-2 text-left">Домашнее задание</th>
                <th className="px-3 py-2 text-center w-16">Пров. ДЗ</th>
                <th className="px-3 py-2 text-left w-40">Тест</th>
              </tr>
            </thead>
            <tbody>
              {allSlots.map((sl, idx) => {
                // ONLY exact match — no fallback to prevent sharing between lessons on same date
                const entry = diaryEntries && Array.isArray(diaryEntries) 
                  ? diaryEntries.find(e => e.date === sl.date && e.subject === selectedSubject && e.lessonNumber === sl.lessonNumber)
                  : null;
                const lt = getLessonType(sl.date, sl.lessonNumber);
                const testObj = entry?.testId && tests && Array.isArray(tests) 
                  ? tests.find(t => t.id === entry.testId) 
                  : null;
                const slotsOnDate = allSlots.filter(s => s.date === sl.date);

                return (
                  <tr key={sl.key} className="border-b border-gray-300 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-2 text-gray-700 font-medium">
                      {parseInt(sl.date.split('-')[2])} {MONTH_NAMES_GEN[parseInt(sl.date.split('-')[1]) - 1]?.slice(0, 3)}
                      {slotsOnDate.length > 1 && <span className="text-primary-600 text-[10px] ml-1">(Ур.{sl.lessonNumber})</span>}
                    </td>
                    <td className="px-3 py-2">
                      <select value={lt?.type || ''} onChange={e => {
                        setLessonTypes(prev => {
                          const existing = prev.find(l => l.date === sl.date && l.subject === selectedSubject && (l.lessonNumber === sl.lessonNumber || (!l.lessonNumber && !sl.lessonNumber)));
                          if (existing) return prev.map(l => l.id === existing.id ? { ...l, type: e.target.value, lessonNumber: sl.lessonNumber } : l);
                          return [...prev, { id: `lt${Date.now()}`, date: sl.date, subject: selectedSubject, type: e.target.value, lessonNumber: sl.lessonNumber }];
                        });
                      }} className="w-full px-2 py-1.5 text-xs border-2 border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500">
                        <option value="">—</option>
                        {customLessonTypes && Array.isArray(customLessonTypes) && customLessonTypes.map(clt => <option key={clt.id} value={clt.value}>{clt.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={entry?.topic || ''} onChange={e => {
                        const ent = getOrCreateDiaryEntry(sl.date, sl.lessonNumber);
                        if (ent) {
                          setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, topic: e.target.value } : de));
                        }
                      }} placeholder="Тема..." className="w-full px-2 py-1.5 text-xs border-2 border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500" />
                    </td>
                    <td className="px-3 py-2">
                      <div className="relative">
                        <input type="text" value={entry?.homework || ''} onChange={e => {
                          const ent = getOrCreateDiaryEntry(sl.date, sl.lessonNumber);
                          if (ent) {
                            setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, homework: e.target.value } : de));
                          }
                        }} placeholder="ДЗ..." className="w-full px-2 py-1.5 pr-8 text-xs border-2 border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500" />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                          {entry?.attachment ? (
                            <a href={entry.attachment.url} download={entry.attachment.name} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Скачать">
                              <Download className="w-3 h-3" />
                            </a>
                          ) : (
                            <label className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded cursor-pointer" title="Прикрепить файл">
                              <Paperclip className="w-3 h-3" />
                              <input type="file" className="hidden" onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = URL.createObjectURL(file);
                                  const ent = getOrCreateDiaryEntry(sl.date, sl.lessonNumber);
                                  if (ent) {
                                    setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, attachment: { name: file.name, url } } : de));
                                  }
                                }
                                e.target.value = '';
                              }} />
                            </label>
                          )}
                          {entry?.attachment && (
                            <button onClick={() => {
                              const ent = getOrCreateDiaryEntry(sl.date, sl.lessonNumber);
                              if (ent) {
                                setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, attachment: undefined } : de));
                              }
                            }} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Удалить">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input type="checkbox" checked={entry?.checkHomework || false} onChange={e => {
                        const ent = getOrCreateDiaryEntry(sl.date, sl.lessonNumber);
                        if (ent) {
                          setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, checkHomework: e.target.checked } : de));
                          if (e.target.checked) {
                            const hasCol = journalColumns.some(c => c.date === sl.date && c.subject === selectedSubject && c.type === 'homework' && (c.lessonNumber === sl.lessonNumber || !c.lessonNumber));
                            if (!hasCol) setJournalColumns(prev => [...prev, { id: `jc${Date.now()}`, date: sl.date, subject: selectedSubject, lessonNumber: sl.lessonNumber, type: 'homework' }]);
                          } else {
                            setJournalColumns(prev => prev.filter(c => !(c.date === sl.date && c.subject === selectedSubject && c.type === 'homework' && (c.lessonNumber === sl.lessonNumber || !c.lessonNumber))));
                          }
                        }
                      }} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                    </td>
                    <td className="px-3 py-2">
                      <select value={entry?.testId || ''} onChange={e => {
                        const ent = getOrCreateDiaryEntry(sl.date, sl.lessonNumber);
                        if (ent) {
                          const prevTestId = ent.testId;
                          setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, testId: e.target.value || undefined, testType: e.target.value ? 'real' as const : undefined } : de));
                          
                          // При назначении теста создаем колонку, при удалении - удаляем
                          if (e.target.value && !prevTestId) {
                            const hasCol = journalColumns.some(c => c.date === sl.date && c.subject === selectedSubject && c.type 