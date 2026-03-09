import React, { useState, useMemo } from 'react';
import {
  FileText, Plus, Trash2, Edit2, Search, X, Save, Copy, RefreshCw, Eye, Users, Clock
} from 'lucide-react';
import { SUBJECTS, type TestQuestion, type TestVariant } from '../data';

// Тип для пробного экзамена
export interface TrialExam {
  id: string;
  title: string;
  subject: string;
  year: number;
  variantCount: number;
  questionsPerVariant: number;
  timeLimit: number;
  createdAt: string;
  questionBank: TestQuestion[];
  variants: TestVariant[];
}

// ==================== PRACTICE MANAGER ====================
export const PracticeManager: React.FC = () => {
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [previewExam, setPreviewExam] = useState<TrialExam | null>(null);
  
  // Локальное состояние для пробных экзаменов
  const [trialExams, setTrialExams] = useState<TrialExam[]>([]);

  // Предметы ОГЭ
  const ogeSubjects = useMemo(() => {
    return SUBJECTS.filter(s => 
      ['Математика', 'Русский язык', 'Обществознание', 'Биология', 
       'Физика', 'Химия', 'История', 'Английский язык', 
       'Информатика', 'География', 'Литература'].includes(s)
    );
  }, []);

  // Фильтр по предмету
  const filteredExams = useMemo(() => {
    if (filterSubject === 'all') return trialExams;
    return trialExams.filter(e => e.subject === filterSubject);
  }, [trialExams, filterSubject]);

  // Генерация вариантов
  const generateVariants = (exam: TrialExam): TestVariant[] => {
    const variants: TestVariant[] = [];
    const bank = exam.questionBank;
    
    if (bank.length === 0) return variants;

    for (let v = 1; v <= exam.variantCount; v++) {
      const shuffled = [...bank].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, exam.questionsPerVariant);
      
      const randomizedQuestions = selectedQuestions.map(q => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5).map((o, i) => ({
          ...o,
          id: String.fromCharCode(65 + i)
        }))
      }));

      variants.push({
        id: `var_${exam.id}_${v}`,
        name: `Вариант ${v}`,
        questions: randomizedQuestions
      });
    }

    return variants;
  };

  // Создать новый экзамен
  const createNewExam = () => {
    const newExam: TrialExam = {
      id: `prob_${Date.now()}`,
      title: '',
      subject: ogeSubjects[0] || 'Математика',
      year: new Date().getFullYear(),
      variantCount: 4,
      questionsPerVariant: 20,
      timeLimit: 180,
      createdAt: new Date().toISOString(),
      questionBank: [],
      variants: []
    };
    setTrialExams(prev => [...prev, newExam]);
  };

  // Обновить экзамен
  const updateExam = (exam: TrialExam) => {
    setTrialExams(prev => prev.map(e => e.id === exam.id ? exam : e));
  };

  // Сохранить экзамен с генерацией вариантов
  const saveExam = (exam: TrialExam) => {
    const examWithVariants = {
      ...exam,
      variants: generateVariants(exam)
    };
    setTrialExams(prev => prev.map(e => e.id === exam.id ? examWithVariants : e));
  };

  // Удалить экзамен
  const deleteExam = (id: string) => {
    setTrialExams(prev => prev.filter(e => e.id !== id));
  };

  // Перегенерировать варианты
  const regenerateVariants = (exam: TrialExam) => {
    const newVariants = generateVariants(exam);
    setTrialExams(prev => prev.map(e => 
      e.id === exam.id ? { ...e, variants: newVariants } : e
    ));
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Пробные экзамены (ОГЭ)</h2>
          <p className="text-sm text-gray-500 mt-1">Создание и генерация вариантов ОГЭ</p>
        </div>
        <button 
          onClick={createNewExam} 
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-indigo-500/25"
        >
          <Plus className="w-5 h-5" /> Создать пробник
        </button>
      </div>
      
      {/* Фильтр */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">Все предметы</option>
          {ogeSubjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </div>

      {/* Список экзаменов */}
      {filteredExams.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Нет пробных экзаменов</h3>
          <p className="text-gray-500 mb-4">Создайте первый пробный экзамен ОГЭ</p>
          <button 
            onClick={createNewExam}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" /> Создать пробник
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredExams.map(exam => (
            <TrialExamCard 
              key={exam.id} 
              exam={exam} 
              onUpdate={updateExam}
              onSave={saveExam}
              onDelete={deleteExam}
              onRegenerate={regenerateVariants}
              onPreview={setPreviewExam}
            />
          ))}
        </div>
      )}

      {/* Модалка предпросмотра */}
      {previewExam && (
        <PreviewModal exam={previewExam} onClose={() => setPreviewExam(null)} />
      )}
    </div>
  );
};

// ==================== EXAM CARD ====================
interface TrialExamCardProps {
  exam: TrialExam;
  onUpdate: (exam: TrialExam) => void;
  onSave: (exam: TrialExam) => void;
  onDelete: (id: string) => void;
  onRegenerate: (exam: TrialExam) => void;
  onPreview: (exam: TrialExam) => void;
}

const TrialExamCard: React.FC<TrialExamCardProps> = ({
  exam, onUpdate, onSave, onDelete, onRegenerate, onPreview
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localExam, setLocalExam] = useState(exam);

  const handleSave = () => {
    onSave(localExam);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-bold text-gray-900 mb-4">Редактирование: {localExam.title || 'Без названия'}</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
            <input
              type="text"
              value={localExam.title}
              onChange={(e) => setLocalExam(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Предмет</label>
            <input
              type="text"
              value={localExam.subject}
              onChange={(e) => setLocalExam(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Год</label>
            <input
              type="number"
              value={localExam.year}
              onChange={(e) => setLocalExam(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Вариантов</label>
            <input
              type="number"
              value={localExam.variantCount}
              onChange={(e) => setLocalExam(prev => ({ ...prev, variantCount: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Вопросов</label>
            <input
              type="number"
              value={localExam.questionsPerVariant}
              onChange={(e) => setLocalExam(prev => ({ ...prev, questionsPerVariant: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Время (мин)</label>
            <input
              type="number"
              value={localExam.timeLimit}
              onChange={(e) => setLocalExam(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
        </div>

        {/* Банк вопросов */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Банк вопросов ({localExam.questionBank.length})</h4>
          <QuestionBankEditor 
            questions={localExam.questionBank} 
            onChange={(questions) => setLocalExam(prev => ({ ...prev, questionBank: questions }))}
          />
        </div>

        <div className="flex gap-2">
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Сохранить</button>
          <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-gray-200 rounded-lg">Отмена</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-gray-900">{exam.title || 'Без названия'}</h3>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg">
              ОГЭ {exam.year}
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> {exam.subject}
            </span>
            <span className="flex items-center gap-1.5">
              <Copy className="w-4 h-4" /> {exam.variantCount} вариантов
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" /> {exam.questionsPerVariant} вопросов
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {exam.timeLimit} мин
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onRegenerate(exam)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl" title="Перегенерировать">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={() => onPreview(exam)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl" title="Предпросмотр">
            <Eye className="w-5 h-5" />
          </button>
          <button onClick={() => { setLocalExam(exam); setIsEditing(true); }} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl" title="Редактировать">
            <Edit2 className="w-5 h-5" />
          </button>
          <button onClick={() => onDelete(exam.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl" title="Удалить">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== QUESTION BANK EDITOR ====================
interface QuestionBankEditorProps {
  questions: TestQuestion[];
  onChange: (questions: TestQuestion[]) => void;
}

const QuestionBankEditor: React.FC<QuestionBankEditorProps> = ({ questions, onChange }) => {
  const [newQ, setNewQ] = useState<Partial<TestQuestion>>({
    type: 'single', text: '', options: [], points: 1
  });

  const addQuestion = () => {
    if (!newQ.text || !newQ.options || newQ.options.length < 2) return;
    
    const question: TestQuestion = {
      id: `q_${Date.now()}`,
      type: newQ.type || 'single',
      text: newQ.text,
      options: newQ.options.map((o, i) => ({
        id: String.fromCharCode(65 + i),
        text: o.text || '',
        correct: o.correct || false
      })),
      points: newQ.points || 1
    };
    
    onChange([...questions, question]);
    setNewQ({ type: 'single', text: '', options: [], points: 1 });
  };

  const addOption = () => {
    setNewQ(prev => ({ ...prev, options: [...(prev.options || []), { text: '', correct: false }] }));
  };

  const updateOption = (idx: number, field: 'text' | 'correct', val: string | boolean) => {
    setNewQ(prev => ({
      ...prev,
      options: prev.options?.map((o, i) => i === idx ? { ...o, [field]: val } : o)
    }));
  };

  const removeOption = (idx: number) => {
    setNewQ(prev => ({ ...prev, options: prev.options?.filter((_, i) => i !== idx) }));
  };

  const removeQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Форма добавления */}
      <div className="bg-gray-50 rounded-xl p-4">
        <textarea
          value={newQ.text}
          onChange={(e) => setNewQ(prev => ({ ...prev, text: e.target.value }))}
          placeholder="Текст вопроса..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-3"
        />
        
        <div className="space-y-2 mb-3">
          {newQ.options?.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500 w-6">{String.fromCharCode(65 + idx)})</span>
              <input
                type="text"
                value={opt.text}
                onChange={(e) => updateOption(idx, 'text', e.target.value)}
                placeholder={`Вариант ${String.fromCharCode(65 + idx)}`}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={opt.correct}
                  onChange={(e) => updateOption(idx, 'correct', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-xs text-gray-500">Прав.</span>
              </label>
              <button onClick={() => removeOption(idx)} className="p-1 text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <button onClick={addOption} className="text-sm text-indigo-600 hover:text-indigo-700">+ Вариант</button>
          <button
            onClick={addQuestion}
            disabled={!newQ.text || !newQ.options || newQ.options.length < 2}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50"
          >
            Добавить вопрос
          </button>
        </div>
      </div>

      {/* Список вопросов */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-600 mr-2">{idx + 1}</span>
              <span className="text-sm">{q.text}</span>
              <div className="mt-1 flex gap-1">
                {q.options?.map((o, i) => (
                  <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${o.correct ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100'}`}>
                    {o.id}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => removeQuestion(q.id)} className="p-1 text-gray-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
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
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{exam.title} - Предпросмотр</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {exam.variants.length > 0 ? (
            <div className="space-y-6">
              {exam.variants.map((variant) => (
                <div key={variant.id} className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-4">{variant.name}</h4>
                  <div className="space-y-4">
                    {variant.questions.map((q, qIdx) => (
                      <div key={q.id} className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium text-gray-900 mb-2">{qIdx + 1}. {q.text}</p>
                        <div className="space-y-1">
                          {q.options.map(opt => (
                            <div key={opt.id} className="text-sm text-gray-600">{opt.id}) {opt.text}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Нет вариантов. Сохраните с генерацией.</p>
          )}
        </div>
      </div>
    </div>
  );
};
