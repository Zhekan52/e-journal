import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context';
import { SUBJECTS, getTodayString } from '../data';
import type { FipiTask, FipiReward, FipiStudentProgress, FipiTaskAttempt, FipiNotification } from '../data';
import {
  Brain, Plus, Trash2, Edit2, Save, X, Award, Users, CheckCircle, XCircle, AlertCircle, Settings, Upload
} from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 15);
type FipiTab = 'tasks' | 'rewards' | 'students' | 'logs' | 'notifications';

export const FipiTrainer: React.FC = () => {
  const { fipiTasks, setFipiTasks, fipiRewards, setFipiRewards, fipiProgress, setFipiProgress,
    fipiAttempts, setFipiAttempts, fipiNotifications, setFipiNotifications, students } = useData();

  const [activeTab, setActiveTab] = useState<FipiTab>('tasks');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<FipiTask | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const filteredTasks = useMemo(() => selectedSubject === 'all' ? fipiTasks : fipiTasks.filter(t => t.subject === selectedSubject), [fipiTasks, selectedSubject]);

  useEffect(() => {
    if (fipiRewards.length === 0) {
      setFipiRewards([
        { id: 'r1', subject: 'Математика', pointsRequired: 10, grade: 5 },
        { id: 'r2', subject: 'Русский язык', pointsRequired: 10, grade: 5 },
        { id: 'r3', subject: 'Обществознание', pointsRequired: 10, grade: 5 },
        { id: 'r4', subject: 'География', pointsRequired: 10, grade: 5 },
      ]);
    }
  }, [fipiRewards.length, setFipiRewards]);

  const handleSaveTask = (task: FipiTask) => {
    const now = getTodayString();
    if (editingTask) {
      setFipiTasks(fipiTasks.map(t => t.id === task.id ? { ...task, updatedAt: now } : t));
    } else {
      setFipiTasks([...fipiTasks, { ...task, id: generateId(), createdAt: now, updatedAt: now }]);
    }
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Удалить задание?')) setFipiTasks(fipiTasks.filter(t => t.id !== taskId));
  };

  const handleSaveReward = (reward: FipiReward) => {
    const existing = fipiRewards.find(r => r.subject === reward.subject);
    if (existing) setFipiRewards(fipiRewards.map(r => r.subject === reward.subject ? reward : r));
    else setFipiRewards([...fipiRewards, { ...reward, id: generateId() }]);
  };

  const handleManualApprove = (attemptId: string) => {
    const attempt = fipiAttempts.find(a => a.id === attemptId);
    if (!attempt) return;
    setFipiAttempts(fipiAttempts.map(a => a.id === attemptId ? { ...a, manuallyApproved: true, correct: true, pointsEarned: 1 } : a));
  };

  const handleConfirmGrade = (notification: FipiNotification) => setFipiNotifications(fipiNotifications.filter(n => n.id !== notification.id));
  const handleAcknowledgeNotification = (id: string) => setFipiNotifications(fipiNotifications.map(n => n.id === id ? { ...n, acknowledged: true } : n));

  const tabs: { id: FipiTab; label: string; icon: React.ReactNode }[] = [
    { id: 'tasks', label: 'Банк заданий', icon: <Brain className="w-5 h-5" /> },
    { id: 'rewards', label: 'Поощрения', icon: <Award className="w-5 h-5" /> },
    { id: 'students', label: 'Ученики', icon: <Users className="w-5 h-5" /> },
    { id: 'logs', label: 'Архив ответов', icon: <Award className="w-5 h-5" /> },
    { id: 'notifications', label: 'Уведомления', icon: <AlertCircle className="w-5 h-5" /> },
  ];

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Ежедневный тренажёр ФИПИ</h2>
        <span className="text-sm text-gray-500">Всего заданий: {fipiTasks.length}</span>
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.id ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent'}`}>
            {tab.icon} {tab.label}
            {tab.id === 'notifications' && fipiNotifications.filter(n => !n.acknowledged).length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{fipiNotifications.filter(n => !n.acknowledged).length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl">
                <option value="all">Все предметы</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="text-sm text-gray-500">{filteredTasks.length} заданий</span>
            </div>
            <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
              <Plus className="w-5 h-5" /> Добавить
            </button>
          </div>
          <div className="grid gap-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500"><Brain className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Нет заданий</p></div>
            ) : filteredTasks.map(task => (
              <div key={task.id} className="bg-white/80 rounded-2xl border p-6 shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs ${task.subject === 'Математика' ? 'bg-blue-100' : task.subject === 'Русский язык' ? 'bg-green-100' : 'bg-purple-100'}`}>{task.subject}</span>
                      <span className="px-2 py-1 rounded text-xs bg-gray-100">{task.type === 'text' ? 'Краткий' : task.type === 'single' ? 'Выбор' : 'Множеств.'}</span>
                    </div>
                    <p className="font-medium">{task.question}</p>
                    {task.image && <img src={task.image} alt="" className="mt-2 max-w-xs rounded border" />}
                    {task.type === 'text' && <p className="text-sm text-green-600 mt-1">Ответ: {task.correctAnswer as string}</p>}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => { setEditingTask(task); setShowTaskModal(true); }} className="p-2 hover:bg-gray-100 rounded"><Edit2 className="w-5 h-5" /></button>
                    <button onClick={() => handleDeleteTask(task.id)} className="p-2 hover:bg-red-50 text-red-500 rounded"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <RewardsEditor rewards={fipiRewards} onSave={handleSaveReward} />
      )}

      {activeTab === 'students' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map(student => {
            const progress = fipiProgress.filter(p => p.studentId === student.id);
            return (
              <div key={student.id} className="bg-white/80 rounded-2xl border p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                    {student.lastName?.charAt(0)}{student.firstName?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold">{student.lastName} {student.firstName}</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  {SUBJECTS.map(subject => {
                    const p = progress.find(x => x.subject === subject);
                    const r = fipiRewards.find(x => x.subject === subject);
                    const pts = p?.totalPoints || 0;
                    const req = r?.pointsRequired || 10;
                    return (
                      <div key={subject}>
                        <div className="flex justify-between text-sm"><span>{subject}</span><span>{pts}/{req}</span></div>
                        <div className="h-2 bg-gray-100 rounded-full"><div className={`h-full rounded-full ${pts >= req ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (pts/req)*100)}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white/80 rounded-2xl border shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50"><tr>
              <th className="px-4 py-3 text-left">Дата</th><th className="px-4 py-3 text-left">Ученик</th><th className="px-4 py-3 text-left">Предмет</th>
              <th className="px-4 py-3 text-left">Вопрос</th><th className="px-4 py-3 text-center">Результат</th><th className="px-4 py-3 text-center">Действия</th>
            </tr></thead>
            <tbody className="divide-y">
              {fipiAttempts.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-gray-500">Нет записей</td></tr> :
                fipiAttempts.map(attempt => {
                  const task = fipiTasks.find(t => t.id === attempt.taskId);
                  const student = students.find(s => s.id === attempt.studentId);
                  return (
                    <tr key={attempt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{attempt.date}</td>
                      <td className="px-4 py-3 text-sm">{student?.lastName} {student?.firstName}</td>
                      <td className="px-4 py-3 text-sm">{attempt.subject}</td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate">{task?.question}</td>
                      <td className="px-4 py-3 text-center">
                        {attempt.correct ? <span className="text-green-600"><CheckCircle className="w-4 h-4 inline" /> Верно</span> : <span className="text-red-600"><XCircle className="w-4 h-4 inline" /> Неверно</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!attempt.correct && !attempt.manuallyApproved && <button onClick={() => handleManualApprove(attempt.id)} className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs">Засчитать</button>}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {fipiNotifications.filter(n => !n.acknowledged).length === 0 ? (
            <div className="text-center py-12 text-gray-500">Нет уведомлений</div>
          ) : fipiNotifications.filter(n => !n.acknowledged).map(notif => (
            <div key={notif.id} className="bg-white/80 rounded-2xl border border-amber-200 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-amber-500" />
                  <div>
                    <p className="font-medium">Ученик <b>{notif.studentName}</b> набрал {notif.pointsRequired} баллов по <b>{notif.subject}</b> для оценки <b className="text-green-600">{notif.grade}</b></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleConfirmGrade(notif)} className="px-4 py-2 bg-green-600 text-white rounded">Выставить</button>
                  <button onClick={() => handleAcknowledgeNotification(notif.id)} className="px-4 py-2 bg-gray-100 rounded">Закрыть</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showTaskModal && <TaskModal task={editingTask} onSave={handleSaveTask} onClose={() => { setShowTaskModal(false); setEditingTask(null); }} />}
    </div>
  );
};

// Компонент редактирования поощрений (отдельный, чтобы соблюсти правила хуков)
const RewardsEditor: React.FC<{ rewards: FipiReward[]; onSave: (r: FipiReward) => void }> = ({ rewards, onSave }) => {
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editPoints, setEditPoints] = useState(10);

  const handleStartEdit = (subject: string, currentPoints: number) => {
    setEditingSubject(subject);
    setEditPoints(currentPoints);
  };

  const handleSave = (subject: string) => {
    const reward = rewards.find(r => r.subject === subject);
    onSave({ id: reward?.id || '', subject, pointsRequired: editPoints, grade: 5 });
    setEditingSubject(null);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {SUBJECTS.map(subject => {
        const reward = rewards.find(r => r.subject === subject);
        const points = reward?.pointsRequired || 10;
        return (
          <div key={subject} className="bg-white/80 rounded-2xl border p-6 shadow-lg">
            <h3 className="font-bold mb-4">{subject}</h3>
            {editingSubject === subject ? (
              <div className="flex gap-2">
                <input type="number" value={editPoints} onChange={(e) => setEditPoints(parseInt(e.target.value) || 10)}
                  className="flex-1 px-3 py-2 border rounded" />
                <button onClick={() => handleSave(subject)} className="px-4 py-2 bg-green-600 text-white rounded"><Save className="w-4 h-4" /></button>
                <button onClick={() => setEditingSubject(null)} className="p-2 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span>{points} баллов = оценка 5</span>
                <button onClick={() => handleStartEdit(subject, points)} className="p-2 hover:bg-gray-100 rounded"><Settings className="w-5 h-5" /></button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface TaskModalProps { task: FipiTask | null; onSave: (task: FipiTask) => void; onClose: () => void; }

const TaskModal: React.FC<TaskModalProps> = ({ task, onSave, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ 
    subject: task?.subject || 'Математика', 
    type: task?.type || 'text' as const, 
    question: task?.question || '', 
    image: task?.image || '', 
    correctAnswer: task?.correctAnswer || '' 
  });
  const [showImage, setShowImage] = useState(!!task?.image);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm({ ...form, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setForm({ ...form, image: '' });
    setShowImage(false);
  };

  const toggleImage = (checked: boolean) => {
    setShowImage(checked);
    if (!checked) {
      setForm({ ...form, image: '' });
    }
  };

  const handleSubmit = () => {
    if (!form.question) return;
    onSave({ 
      id: task?.id || generateId(), 
      subject: form.subject, 
      type: form.type, 
      question: form.question, 
      image: form.image || undefined, 
      options: [], 
      correctAnswer: form.correctAnswer, 
      createdAt: task?.createdAt || getTodayString(), 
      updatedAt: getTodayString() 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">{task ? 'Редактировать задание' : 'Новое задание'}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-5 space-y-5">
          {/* Предмет и тип в одной строке */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Предмет</label>
              <select 
                value={form.subject} 
                onChange={(e) => setForm({ ...form, subject: e.target.value })} 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Тип ответа</label>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {[
                  { value: 'text', label: 'Краткий' },
                  { value: 'single', label: 'Выбор' },
                  { value: 'multiple', label: 'Множеств.' }
                ].map(t => (
                  <button 
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.value as any })} 
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${form.type === t.value ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Текст вопроса */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текст вопроса
            </label>
            <textarea
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="Введите текст вопроса..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-y"
            />
          </div>

          {/* Изображение - флажок */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={showImage}
                onChange={(e) => toggleImage(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Прикрепить изображение</span>
            </label>
            
            {showImage && (
              <div className="ml-8">
                {!form.image ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 hover:bg-gray-50 transition-all"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="text-sm">Загрузить изображение</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <span className="text-xs text-gray-400">Максимум 5MB</span>
                  </div>
                ) : (
                  <div className="relative group">
                    <img
                      src={form.image}
                      alt="Question image"
                      className="max-h-64 w-auto rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      title="Удалить изображение"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ответ (только для текстового типа) */}
          {form.type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Правильный ответ
              </label>
              <input
                type="text"
                value={form.correctAnswer}
                onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                placeholder="Введите правильный ответ..."
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100 bg-gray-50">
          <button 
            onClick={onClose} 
            className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            Отмена
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={!form.question}
            className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};
