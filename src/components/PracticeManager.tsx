import React, { useState, useMemo } from 'react';
import { useData } from '../context';
import {
  FileText, Plus, Trash2, Edit2, Search, X, Save, Copy, RefreshCw, Eye, Users, Clock,
  Printer, CheckCircle, BookOpen, Settings
} from 'lucide-react';
import { SUBJECTS, formatDate } from '../data';
import type { QuestionBankItem, TrialExam, TrialVariant, TrialResult, Student } from '../data';

// Типы для вкладок
type Tab = 'bank' | 'exams' | 'results';

export const PracticeManager: React.FC = () => {
  const { questionBank, setQuestionBank, trialExams, setTrialExams, trialResults, setTrialResults, students } = useData();
  const [activeTab, setActiveTab] = useState<Tab>('bank');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="animate-fadeIn">
      {/* Заголовок */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Пробные экзамены (ОГЭ)</h2>
        <p className="text-sm text-gray-500 mt-1">Управление базой заданий и проведение пробных экзаменов</p>
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('bank')}
          className={`px-4 py-2.5 font-medium rounded-t-xl transition-colors ${
            activeTab === 'bank'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          База заданий ({questionBank.length})
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2.5 font-medium rounded-t-xl transition-colors ${
            activeTab === 'exams'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Экзамены ({trialExams.length})
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2.5 font-medium rounded-t-xl transition-colors ${
            activeTab === 'results'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <CheckCircle className="w-4 h-4 inline mr-2" />
          Результаты ({trialResults.length})
        </button>
      </div>

      {/* Фильтры */}
      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">Все предметы</option>
          {SUBJECTS.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </div>

      {/* Контент */}
      {activeTab === 'bank' && (
        <QuestionBankView 
          questions={questionBank} 
          setQuestions={setQuestionBank}
          filterSubject={filterSubject}
          searchQuery={searchQuery}
        />
      )}
      {activeTab === 'exams' && (
        <TrialExamsView 
          exams={trialExams}
          setExams={setTrialExams}
          questions={questionBank}
          filterSubject={filterSubject}
          searchQuery={searchQuery}
        />
      )}
      {activeTab === 'results' && (
        <ResultsView 
          results={trialResults}
          setResults={setTrialResults}
          exams={trialExams}
          students={students}
        />
      )}
    </div>
  );
};

// ==================== QUESTION BANK VIEW ====================
interface QuestionBankViewProps {
  questions: QuestionBankItem[];
  setQuestions: React.Dispatch<React.SetStateAction<QuestionBankItem[]>>;
  filterSubject: string;
  searchQuery: string;
}

const QuestionBankView: React.FC<QuestionBankViewProps> = ({ questions, setQuestions, filterSubject, searchQuery }) => {
  const [showEditor, setShowEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null);

  // Фильтрация вопросов
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesSubject = filterSubject === 'all' || q.subject === filterSubject;
      const matchesSearch = !searchQuery || 
        q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.theme.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSubject && matchesSearch;
    });
  }, [questions, filterSubject, searchQuery]);

  // Группы по предметам
  const questionsBySubject = useMemo(() => {
    const grouped: Record<string, QuestionBankItem[]> = {};
    filteredQuestions.forEach(q => {
      if (!grouped[q.subject]) grouped[q.subject] = [];
      grouped[q.subject].push(q);
    });
    return grouped;
  }, [filteredQuestions]);

  const addQuestion = (question: QuestionBankItem) => {
    setQuestions(prev => [...prev, question]);
  };

  const updateQuestion = (question: QuestionBankItem) => {
    setQuestions(prev => prev.map(q => q.id === question.id ? question : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const getUniqueThemes = (subjectQuestions: QuestionBankItem[]) => {
    const themes = new Set(subjectQuestions.map(q => q.theme));
    return Array.from(themes).sort();
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setEditingQuestion(null); setShowEditor(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" /> Добавить вопрос
        </button>
      </div>

      {Object.keys(questionsBySubject).length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Нет вопросов</h3>
          <p className="text-gray-500">Добавьте вопросы в базу</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(questionsBySubject).map(([subject, subjectQuestions]) => (
            <div key={subject} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100">
                <h3 className="font-bold text-indigo-900">{subject}</h3>
                <p className="text-sm text-indigo-600">{subjectQuestions.length} вопросов</p>
              </div>
              <div className="p-4">
                {getUniqueThemes(subjectQuestions).map(theme => (
                  <div key={theme} className="mb-4 last:mb-0">
                    <h4 className="font-medium text-gray-700 mb-2">{theme}</h4>
                    <div className="space-y-2">
                      {subjectQuestions.filter(q => q.theme === theme).map(q => (
                        <QuestionCard 
                          key={q.id} 
                          question={q} 
                          onEdit={() => { setEditingQuestion(q); setShowEditor(true); }}
                          onDelete={() => deleteQuestion(q.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditor && (
        <QuestionEditorModal
          question={editingQuestion}
          onSave={editingQuestion ? updateQuestion : addQuestion}
          onClose={() => { setShowEditor(false); setEditingQuestion(null); }}
        />
      )}
    </div>
  );
};

// ==================== QUESTION CARD ====================
interface QuestionCardProps {
  question: QuestionBankItem;
  onEdit: () => void;
  onDelete: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onEdit, onDelete }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-4 flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">
            №{question.taskNumber}
          </span>
          <span className="text-xs text-gray-500">{question.points} балл(ов)</span>
        </div>
        <p className="text-gray-900 mb-2">{question.text}</p>
        {question.image && (
          <img src={question.image} alt="" className="max-w-xs rounded-lg mb-2" />
        )}
        <div className="flex flex-wrap gap-1">
          {question.options.map((opt, i) => (
            <span 
              key={i} 
              className={`text-xs px-2 py-1 rounded ${
                opt.correct ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {opt.id}) {opt.text}
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-1 ml-2">
        <button onClick={onEdit} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ==================== QUESTION EDITOR MODAL ====================
interface QuestionEditorModalProps {
  question: QuestionBankItem | null;
  onSave: (question: QuestionBankItem) => void;
  onClose: () => void;
}

const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({ question, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<QuestionBankItem>>(
    question || {
      subject: SUBJECTS[0],
      theme: '',
      taskNumber: 1,
      text: '',
      options: [],
      points: 1
    }
  );

  const addOption = () => {
    setForm(prev => ({
      ...prev,
      options: [...(prev.options || []), { id: String.fromCharCode(65 + (prev.options?.length || 0)), text: '', correct: false }]
    }));
  };

  const updateOption = (idx: number, field: 'text' | 'correct', value: string | boolean) => {
    setForm(prev => ({
      ...prev,
      options: prev.options?.map((o, i) => i === idx ? { ...o, [field]: value } : o)
    }));
  };

  const handleSubmit = () => {
    if (!form.subject || !form.theme || !form.text || !form.options || form.options.length < 2) return;
    
    const newQuestion: QuestionBankItem = {
      id: form.id || `q_${Date.now()}`,
      subject: form.subject,
      theme: form.theme,
      taskNumber: form.taskNumber || 1,
      text: form.text,
      image: form.image,
      options: form.options.map((o, i) => ({ ...o, id: String.fromCharCode(65 + i) })),
      points: form.points || 1,
      createdAt: form.createdAt || new Date().toISOString()
    };
    onSave(newQuestion);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{question ? 'Редактирование' : 'Новый вопрос'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Предмет</label>
              <select
                value={form.subject}
                onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              >
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тема</label>
              <input
                type="text"
                value={form.theme}
                onChange={(e) => setForm(prev => ({ ...prev, theme: e.target.value }))}
                placeholder="Числа и вычисления"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">№ задания</label>
              <input
                type="number"
                value={form.taskNumber}
                onChange={(e) => setForm(prev => ({ ...prev, taskNumber: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Текст вопроса</label>
            <textarea
              value={form.text}
              onChange={(e) => setForm(prev => ({ ...prev, text: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Баллы</label>
            <input
              type="number"
              value={form.points}
              onChange={(e) => setForm(prev => ({ ...prev, points: parseInt(e.target.value) }))}
              className="w-24 px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Варианты ответов</label>
            <div className="space-y-2">
              {form.options?.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 text-sm font-medium text-gray-500">{String.fromCharCode(65 + idx)})</span>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => updateOption(idx, 'text', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={opt.correct}
                      onChange={(e) => updateOption(idx, 'correct', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs text-gray-500">Прав.</span>
                  </label>
                </div>
              ))}
            </div>
            <button onClick={addOption} className="mt-2 text-sm text-indigo-600 hover:text-indigo-700">
              + Добавить вариант
            </button>
          </div>

          <div className="flex gap-2 pt-4">
            <button onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Сохранить</button>
            <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg">Отмена</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== TRIAL EXAMS VIEW ====================
interface TrialExamsViewProps {
  exams: TrialExam[];
  setExams: React.Dispatch<React.SetStateAction<TrialExam[]>>;
  questions: QuestionBankItem[];
  filterSubject: string;
  searchQuery: string;
}

const TrialExamsView: React.FC<TrialExamsViewProps> = ({ exams, setExams, questions, filterSubject, searchQuery }) => {
  const [showEditor, setShowEditor] = useState(false);
  const [editingExam, setEditingExam] = useState<TrialExam | null>(null);
  const [previewExam, setPreviewExam] = useState<TrialExam | null>(null);
  const [showResultsInput, setShowResultsInput] = useState<TrialExam | null>(null);

  const filteredExams = useMemo(() => {
    return exams.filter(e => {
      const matchesSubject = filterSubject === 'all' || e.subject === filterSubject;
      const matchesSearch = !searchQuery || 
        e.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSubject && matchesSearch;
    });
  }, [exams, filterSubject, searchQuery]);

  const addExam = (exam: TrialExam) => {
    setExams(prev => [...prev, exam]);
  };

  const updateExam = (exam: TrialExam) => {
    setExams(prev => prev.map(e => e.id === exam.id ? exam : e));
  };

  const deleteExam = (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
  };

  // Генерация вариантов из базы вопросов
  const generateVariants = (exam: TrialExam): TrialVariant[] => {
    const subjectQuestions = questions.filter(q => q.subject === exam.subject);
    if (subjectQuestions.length === 0) return [];

    const variants: TrialVariant[] = [];
    for (let v = 1; v <= exam.variantCount; v++) {
      const shuffled = [...subjectQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, exam.questionsPerVariant);
      
      variants.push({
        id: `var_${exam.id}_${v}`,
        name: `Вариант ${v}`,
        questions: selected.map(q => ({
          id: q.id,
          taskNumber: q.taskNumber,
          text: q.text,
          image: q.image,
          options: q.options.map(o => ({ ...o })).sort(() => Math.random() - 0.5),
          points: q.points
        }))
      });
    }
    return variants;
  };

  const handleGenerateVariants = (exam: TrialExam) => {
    const variants = generateVariants(exam);
    const updatedExam = { ...exam, generated: true, variants };
    updateExam(updatedExam);
  };

  // Получить вопросы для экзамена
  const getExamQuestions = (exam: TrialExam) => {
    const subjectQuestions = questions.filter(q => q.subject === exam.subject);
    return subjectQuestions;
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setEditingExam(null); setShowEditor(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" /> Создать экзамен
        </button>
      </div>

      {filteredExams.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Нет экзаменов</h3>
          <p className="text-gray-500">Создайте пробный экзамен</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredExams.map(exam => (
            <div key={exam.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{exam.title}</h3>
                    {exam.generated && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                        Сгенерировано
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{exam.subject}</span>
                    <span>ОГЭ {exam.year}</span>
                    <span>{exam.date || 'Без даты'}</span>
                    <span>{exam.variantCount} вар.</span>
                    <span>{exam.questionsPerVariant} вопр.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!exam.generated && (
                    <button
                      onClick={() => handleGenerateVariants(exam)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm hover:bg-indigo-200"
                    >
                      <RefreshCw className="w-4 h-4" /> Сгенерировать
                    </button>
                  )}
                  <button
                    onClick={() => setPreviewExam(exam)}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => { setEditingExam(exam); setShowEditor(true); }}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowResultsInput(exam)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                    title="Ввод баллов"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteExam(exam.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Статистика по вопросам */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <span className="text-gray-600">В базе по предмету: </span>
                <span className="font-medium">{getExamQuestions(exam).length}</span>
                <span className="text-gray-500"> вопросов</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditor && (
        <ExamEditorModal
          exam={editingExam}
          onSave={editingExam ? updateExam : addExam}
          onClose={() => { setShowEditor(false); setEditingExam(null); }}
        />
      )}

      {previewExam && (
        <PreviewModal exam={previewExam} onClose={() => setPreviewExam(null)} />
      )}

      {showResultsInput && (
        <ResultsInputModal
          exam={showResultsInput}
          onClose={() => setShowResultsInput(null)}
        />
      )}
    </div>
  );
};

// ==================== EXAM EDITOR MODAL ====================
interface ExamEditorModalProps {
  exam: TrialExam | null;
  onSave: (exam: TrialExam) => void;
  onClose: () => void;
}

const ExamEditorModal: React.FC<ExamEditorModalProps> = ({ exam, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<TrialExam>>(
    exam || {
      title: '',
      subject: SUBJECTS[0],
      year: new Date().getFullYear(),
      date: '',
      lessonNumber: 1,
      variantCount: 4,
      questionsPerVariant: 20,
      timeLimit: 180,
      generated: false,
      variants: [],
      createdAt: new Date().toISOString()
    }
  );

  const handleSubmit = () => {
    if (!form.title || !form.subject) return;
    
    const newExam: TrialExam = {
      id: form.id || `exam_${Date.now()}`,
      title: form.title,
      subject: form.subject,
      year: form.year || new Date().getFullYear(),
      date: form.date || '',
      lessonNumber: form.lessonNumber || 1,
      variantCount: form.variantCount || 4,
      questionsPerVariant: form.questionsPerVariant || 20,
      timeLimit: form.timeLimit || 180,
      generated: form.generated || false,
      variants: form.variants || [],
      createdAt: form.createdAt || new Date().toISOString()
    };
    onSave(newExam);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{exam ? 'Редактирование' : 'Новый экзамен'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Пробный экзамен по математике"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Предмет</label>
              <select
                value={form.subject}
                onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              >
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Год ОГЭ</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Вариантов</label>
              <input
                type="number"
                value={form.variantCount}
                onChange={(e) => setForm(prev => ({ ...prev, variantCount: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Вопросов</label>
              <input
                type="number"
                value={form.questionsPerVariant}
                onChange={(e) => setForm(prev => ({ ...prev, questionsPerVariant: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Время (мин)</label>
              <input
                type="number"
                value={form.timeLimit}
                onChange={(e) => setForm(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Сохранить</button>
            <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg">Отмена</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== PREVIEW MODAL ====================
interface PreviewModalProps {
  exam: TrialExam;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ exam, onClose }) => {
  const handlePrint = () => {
    const printContent = document.getElementById('print-area');
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${exam.title} - Вариант</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 18px; margin-bottom: 10px; }
            .variant { margin-bottom: 30px; }
            .question { margin-bottom: 15px; }
            .question-num { font-weight: bold; }
            .options { margin-left: 20px; }
            .option { margin-bottom: 5px; }
            .answer-box { border: 1px solid #000; width: 30px; height: 20px; display: inline-block; margin-left: 10px; }
            @media print { .pagebreak { page-break-before: always; } }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{exam.title}</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Printer className="w-4 h-4" /> Печать
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6" id="print-area">
          {exam.variants.length > 0 ? (
            exam.variants.map((variant, idx) => (
              <div key={variant.id} className={idx > 0 ? 'pagebreak mt-8' : ''}>
                <h4 className="font-bold text-lg mb-4">{variant.name}</h4>
                <div className="space-y-4">
                  {variant.questions.map((q, qIdx) => (
                    <div key={q.id} className="question">
                      <p className="question-num">{q.taskNumber}. {q.text}</p>
                      {q.image && <img src={q.image} alt="" className="max-w-xs my-2" />}
                      <div className="options">
                        {q.options.map(opt => (
                          <div key={opt.id} className="option">
                            {opt.id}) {opt.text} <span className="answer-box"></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">Сгенерируйте варианты</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== RESULTS INPUT MODAL ====================
interface ResultsInputModalProps {
  exam: TrialExam;
  onClose: () => void;
}

const ResultsInputModal: React.FC<ResultsInputModalProps> = ({ exam, onClose }) => {
  const { students, trialResults, setTrialResults } = useData();
  const [selectedVariant, setSelectedVariant] = useState<string>(exam.variants[0]?.id || '');
  const [results, setResults] = useState<Record<string, { points: number; maxPoints: number }>>({});

  // Получить результаты для этого экзамена
  const existingResults = trialResults.filter(r => r.examId === exam.id);

  const examMaxPoints = exam.variants
    .find(v => v.id === selectedVariant)
    ?.questions.reduce((sum, q) => sum + q.points, 0) || 0;

  const handleSaveResult = (studentId: string, points: number) => {
    setResults(prev => ({ ...prev, [studentId]: { points, maxPoints: examMaxPoints } }));
  };

  const handleSaveAll = () => {
    const newResults: TrialResult[] = Object.entries(results).map(([studentId, data]) => {
      const percent = (data.points / data.maxPoints) * 100;
      let grade = 2;
      if (percent >= 90) grade = 5;
      else if (percent >= 70) grade = 4;
      else if (percent >= 50) grade = 3;

      return {
        id: `result_${exam.id}_${studentId}_${Date.now()}`,
        examId: exam.id,
        studentId,
        variantId: selectedVariant,
        date: exam.date || new Date().toISOString().split('T')[0],
        maxPoints: data.maxPoints,
        earnedPoints: data.points,
        percent,
        grade,
        answers: [],
        completedAt: new Date().toISOString()
      };
    });

    setTrialResults(prev => [...prev, ...newResults]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Ввод баллов: {exam.title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Вариант</label>
            <select
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            >
              {exam.variants.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.questions.length} вопросов)</option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">Максимум баллов: {examMaxPoints}</p>
          </div>

          <div className="space-y-2 mb-4">
            {students.map(student => {
              const existing = existingResults.find(r => r.studentId === student.id);
              const current = results[student.id] || { points: existing?.earnedPoints || 0, maxPoints: examMaxPoints };
              
              return (
                <div key={student.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium">{student.lastName} {student.firstName}</span>
                    {existing && (
                      <span className="ml-2 text-xs text-gray-500">
                        (уже: {existing.earnedPoints}/{existing.maxPoints} = {existing.grade})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={examMaxPoints}
                      value={current.points}
                      onChange={(e) => handleSaveResult(student.id, parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center"
                    />
                    <span className="text-gray-500">/ {examMaxPoints}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button onClick={handleSaveAll} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Сохранить все</button>
            <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg">Отмена</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== RESULTS VIEW ====================
interface ResultsViewProps {
  results: TrialResult[];
  setResults: React.Dispatch<React.SetStateAction<TrialResult[]>>;
  exams: TrialExam[];
  students: Student[];
}

const ResultsView: React.FC<ResultsViewProps> = ({ results, setResults, exams, students }) => {
  const getExam = (examId: string) => exams.find(e => e.id === examId);
  const getStudent = (studentId: string) => students.find(s => s.id === studentId);

  const resultsByExam = useMemo(() => {
    const grouped: Record<string, TrialResult[]> = {};
    results.forEach(r => {
      if (!grouped[r.examId]) grouped[r.examId] = [];
      grouped[r.examId].push(r);
    });
    return grouped;
  }, [results]);

  return (
    <div>
      {Object.keys(resultsByExam).length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Нет результатов</h3>
          <p className="text-gray-500">Результаты появятся после ввода баллов</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(resultsByExam).map(([examId, examResults]) => {
            const exam = getExam(examId);
            if (!exam) return null;
            
            return (
              <div key={examId} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100">
                  <h3 className="font-bold text-emerald-900">{exam.title}</h3>
                  <p className="text-sm text-emerald-600">{examResults.length} результатов</p>
                </div>
                <div className="p-4">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500">
                        <th className="pb-2">Ученик</th>
                        <th className="pb-2">Вариант</th>
                        <th className="pb-2">Баллы</th>
                        <th className="pb-2">%</th>
                        <th className="pb-2">Оценка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examResults.map(result => {
                        const student = getStudent(result.studentId);
                        return (
                          <tr key={result.id} className="border-t border-gray-100">
                            <td className="py-2">{student?.lastName} {student?.firstName}</td>
                            <td className="py-2 text-gray-500">{result.variantId.split('_').pop()}</td>
                            <td className="py-2">{result.earnedPoints}/{result.maxPoints}</td>
                            <td className="py-2">{result.percent.toFixed(0)}%</td>
                            <td className="py-2">
                              <span className={`px-2 py-1 rounded text-sm font-medium ${
                                result.grade === 5 ? 'bg-emerald-100 text-emerald-700' :
                                result.grade === 4 ? 'bg-blue-100 text-blue-700' :
                                result.grade === 3 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {result.grade}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
