import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context';
import { SUBJECTS, getTodayString } from '../data';
import type { FipiTask, FipiReward, FipiStudentProgress, FipiTaskAttempt, FipiNotification } from '../data';
import {
  Brain, Plus, Trash2, Edit2, Save, X, Award, Users, CheckCircle, XCircle, AlertCircle, Settings
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
        <div className="grid gap-4 md:grid-cols-2">
          {SUBJECTS.map(subject => {
            const reward = fipiRewards.find(r => r.subject === subject);
            const [editing, setEditing] = useState(false);
            const [points, setPoints] = useState(reward?.pointsRequired || 10);
            return (
              <div key={subject} className="bg-white/80 rounded-2xl border p-6 shadow-lg">
                <h3 className="font-bold mb-4">{subject}</h3>
                {editing ? (
                  <div className="flex gap-2">
                    <input type="number" value={points} onChange={(e) => setPoints(parseInt(e.target.value) || 10)}
                      className="flex-1 px-3 py-2 border rounded" />
                    <button onClick={() => { handleSaveReward({ id: reward?.id || '', subject, pointsRequired: points, grade: 5 }); setEditing(false); }}
                      className="px-4 py-2 bg-green-600 text-white rounded"><Save className="w-4 h-4" /></button>
                    <button onClick={() => setEditing(false)} className="p-2 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span>{reward?.pointsRequired || 10} баллов = оценка 5</span>
                    <button onClick={() => setEditing(true)} className="p-2 hover:bg-gray-100 rounded"><Settings className="w-5 h-5" /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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

interface TaskModalProps { task: FipiTask | null; onSave: (task: FipiTask) => void; onClose: () => void; }

const TaskModal: React.FC<TaskModalProps> = ({ task, onSave, onClose }) => {
  const [form, setForm] = useState({ subject: task?.subject || 'Математика', type: task?.type || 'text' as const, question: task?.question || '', image: task?.image || '', correctAnswer: task?.correctAnswer || '' });

  const handleSubmit = () => {
    if (!form.question) return;
    onSave({ id: task?.id || generateId(), subject: form.subject, type: form.type, question: form.question, image: form.image || undefined, options: [], correctAnswer: form.correctAnswer, createdAt: task?.createdAt || getTodayString(), updatedAt: getTodayString() });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
        <div className="flex justify-between mb-4"><h3 className="text-xl font-bold">{task ? 'Редактировать' : 'Новое задание'}</h3><button onClick={onClose}><X className="w-5 h-5" /></button></div>
        <div className="space-y-4">
          <div><label className="block text-sm mb-1">Предмет</label><select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full p-2 border rounded">{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label className="block text-sm mb-1">Тип</label><div className="flex gap-2">{['text', 'single', 'multiple'].map(t => <button key={t} onClick={() => setForm({ ...form, type: t as any })} className={`flex-1 p-2 rounded ${form.type === t ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{t === 'text' ? 'Краткий' : t === 'single' ? 'Выбор' : 'Множеств.'}</button>)}</div></div>
          <div><label className="block text-sm mb-1">Вопрос</label><textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} rows={3} className="w-full p-2 border rounded" /></div>
          <div><label className="block text-sm mb-1">Изображение (URL)</label><input type="url" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full p-2 border rounded" /></div>
          {form.type === 'text' && <div><label className="block text-sm mb-1">Ответ</label><input value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })} className="w-full p-2 border rounded" /></div>}
        </div>
        <div className="flex gap-3 mt-6"><button onClick={onClose} className="flex-1 p-3 bg-gray-100 rounded">Отмена</button><button onClick={handleSubmit} disabled={!form.question} className="flex-1 p-3 bg-blue-600 text-white rounded disabled:opacity-50">Сохранить</button></div>
      </div>
    </div>
  );
};
