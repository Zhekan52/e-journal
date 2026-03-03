import React, { useState, useMemo, useEffect } from 'react';
import { useAuth, useData } from '../context';
import { SUBJECTS, getTodayString, getTodayDate } from '../data';
import type { FipiTask, FipiStudentProgress, FipiTaskAttempt, FipiReward, FipiNotification } from '../data';
import {
  Brain, CheckCircle, XCircle, ChevronRight, Award, Clock, RefreshCw,
  Image as ImageIcon, Eye, X, Star, Trophy, Target, Lock
} from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 15);

// Валидация ответа (регистронезависимая, без лишних пробелов)
function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

function checkAnswer(userAnswer: string | string[], correctAnswer: string | string[], type: string): boolean {
  if (type === 'text') {
    return normalizeAnswer(userAnswer as string) === normalizeAnswer(correctAnswer as string);
  } else if (type === 'single') {
    return userAnswer === correctAnswer;
  } else if (type === 'multiple') {
    const user = userAnswer as string[];
    const correct = correctAnswer as string[];
    return user.length === correct.length && user.every(a => correct.includes(a));
  }
  return false;
}

export const FipiWidget: React.FC = () => {
  const { user } = useAuth();
  const {
    fipiTasks, fipiRewards, fipiProgress, fipiAttempts, setFipiProgress,
    setFipiAttempts, fipiNotifications, setFipiNotifications, setGrades, grades
  } = useData();

  const [todayTasks, setTodayTasks] = useState<FipiTask[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [answer, setAnswer] = useState<string | string[]>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [timeUntilTomorrow, setTimeUntilTomorrow] = useState<string>('');
  const [tasksGenerated, setTasksGenerated] = useState(false);

  const today = getTodayString();

  // Сбрасываем флаг генерации при смене даты
  useEffect(() => {
    setTasksGenerated(false);
  }, [today]);

  // Таймер до полуночи
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeUntilTomorrow(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Получить или создать прогресс ученика
  const studentProgress = useMemo(() => {
    return fipiProgress.filter(p => p.studentId === user?.id);
  }, [fipiProgress, user?.id]);

  // Получить прогресс по предмету
  const getSubjectProgress = (subject: string): FipiStudentProgress | undefined => {
    return studentProgress.find(p => p.subject === subject);
  };

  // Получить награду по предмету
  const getReward = (subject: string): FipiReward | undefined => {
    return fipiRewards.find(r => r.subject === subject);
  };

  // Инициализация прогресса при первом входе
  useEffect(() => {
    if (!user || user.role !== 'student') return;

    SUBJECTS.forEach(subject => {
      const existing = getSubjectProgress(subject);
      if (!existing) {
        const newProgress: FipiStudentProgress = {
          id: generateId(),
          studentId: user.id,
          subject,
          totalPoints: 0,
          completedTasks: [],
          lastTaskDate: '',
          todayTasks: [],
        };
        setFipiProgress([...fipiProgress, newProgress]);
      }
    });
  }, [user]);

  // Псевдослучайный генератор
  const getSeededRandom = (seed: string): number => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) / 2147483647;
  };

  // Генерация заданий - отдельная функция
  const generateTodayTasks = () => {
    if (!user || user.role !== 'student') return;
    if (fipiTasks.length === 0) return;

    // Текущий прогресс ученика
    const currentProgress = fipiProgress.filter(p => p.studentId === user.id);
    
    // Находим предметы, у которых уже есть задания на сегодня
    const subjectsWithTodayTasks = new Set(
      currentProgress
        .filter(p => p.lastTaskDate === today && p.todayTasks && p.todayTasks.length > 0)
        .map(p => p.subject)
    );
    
    // Если уже есть 2 задания - не генерируем
    if (subjectsWithTodayTasks.size >= 2) {
      setTasksGenerated(true);
      return;
    }

    // Seed для перемешивания предметов (добавляем случайность чтобы у всех были разные)
    const seed = `${user.id}_${today}_${Date.now()}`;
    
    // Перемешиваем все предметы
    const shuffled = [...SUBJECTS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(getSeededRandom(`${seed}_shuffle_${i}`) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Фильтруем: исключаем предметы, по которым уже есть задания на сегодня
    const availableSubjects = shuffled.filter(s => !subjectsWithTodayTasks.has(s));
    
    // Выбираем нужное количество предметов (чтобы всего было 2)
    const neededCount = 2 - subjectsWithTodayTasks.size;
    const selectedSubjects = availableSubjects.slice(0, neededCount);
    
    // Собираем задания для выбранных предметов
    const newTasksMap: Record<string, string> = {};
    
    selectedSubjects.forEach(subject => {
      const subjProgress = currentProgress.find(p => p.subject === subject);
      const subjectTasks = fipiTasks.filter(t => t.subject === subject);
      const completedIds = subjProgress?.completedTasks || [];
      
      // Доступные задания (не выполненные)
      const availableTasks = subjectTasks.filter(t => !completedIds.includes(t.id));
      
      if (availableTasks.length > 0) {
        const taskSeed = `${user.id}_${today}_${subject}_${Date.now()}`;
        const randomIndex = Math.floor(getSeededRandom(taskSeed) * availableTasks.length);
        newTasksMap[subject] = availableTasks[randomIndex].id;
      }
    });

    // Обновляем прогресс
    setFipiProgress(prev => {
      let updated = [...prev];
      
      // Обновляем существующие записи или создаём новые
      selectedSubjects.forEach(subject => {
        const taskId = newTasksMap[subject];
        if (!taskId) return;
        
        const existingIdx = updated.findIndex(p => p.studentId === user.id && p.subject === subject);
        
        if (existingIdx >= 0) {
          // Обновляем существующую запись
          updated[existingIdx] = {
            ...updated[existingIdx],
            lastTaskDate: today,
            todayTasks: [taskId]
          };
        } else {
          // Создаём новую запись
          updated.push({
            id: generateId(),
            studentId: user.id,
            subject,
            totalPoints: 0,
            completedTasks: [],
            lastTaskDate: today,
            todayTasks: [taskId]
          });
        }
      });
      
      return updated;
    });
    
    setTasksGenerated(true);
  };

  // Запускаем генерацию при загрузке и при изменении данных
  useEffect(() => {
    if (user && user.role === 'student' && fipiTasks.length > 0) {
      generateTodayTasks();
    }
  }, [user, fipiTasks, fipiProgress]);

  // Загрузка сегодняшних заданий
  useEffect(() => {
    if (!user || user.role !== 'student') return;

    const allTodayTasks: FipiTask[] = [];
    SUBJECTS.forEach(subject => {
      const progress = getSubjectProgress(subject);
      if (progress && progress.lastTaskDate === today) {
        const taskIds = progress.todayTasks || [];
        taskIds.forEach(taskId => {
          const task = fipiTasks.find(t => t.id === taskId);
          if (task) allTodayTasks.push(task);
        });
      }
    });
    setTodayTasks(allTodayTasks);
  }, [fipiProgress, fipiTasks, user, today]);

  const currentTask = todayTasks[currentTaskIndex];
  const progress = currentTask ? getSubjectProgress(currentTask.subject) : undefined;
  const reward = currentTask ? getReward(currentTask.subject) : undefined;

  // Если не ученик - не показываем виджет
  if (!user || user.role !== 'student') return null;

  // Проверяем, все ли задания выполнены (правильно)
  const allCompleted = todayTasks.every(task => {
    const taskAttempt = fipiAttempts.find(a => 
      a.taskId === task.id && a.studentId === user.id && a.date === today && a.correct
    );
    return !!taskAttempt;
  });

  // Получаем задания, на которые уже даны ответы (любые - правильные или нет)
  const answeredTaskIds = useMemo(() => {
    return new Set(
      fipiAttempts
        .filter(a => a.studentId === user?.id && a.date === today)
        .map(a => a.taskId)
    );
  }, [fipiAttempts, user?.id, today]);

  // Получаем задания, которые ещё не отвечены
  const pendingTasks = todayTasks.filter(task => !answeredTaskIds.has(task.id));

  // Обработка ответа
  const handleSubmitAnswer = () => {
    if (!currentTask || !user) return;

    const correct = checkAnswer(answer, currentTask.correctAnswer, currentTask.type);
    setIsCorrect(correct);
    setShowResult(true);

    // Записываем попытку
    const attempt: FipiTaskAttempt = {
      id: generateId(),
      studentId: user.id,
      taskId: currentTask.id,
      subject: currentTask.subject,
      date: today,
      answer,
      correct,
      pointsEarned: correct ? 1 : 0,
    };
    setFipiAttempts([...fipiAttempts, attempt]);

    // Обновляем прогресс только при правильном ответе
    if (progress && correct) {
      // Проверяем, не был ли уже этот ответ правильным
      const alreadyCompleted = progress.completedTasks.includes(currentTask.id);
      
      if (!alreadyCompleted) {
        const newTotalPoints = progress.totalPoints + 1;
        const newCompletedTasks = [...progress.completedTasks, currentTask.id];

        // Проверяем порог для оценки
        const reward = getReward(currentTask.subject);
        const pointsRequired = reward?.pointsRequired || 10;
        const previousPoints = progress.totalPoints;
        
        setFipiProgress(prev => prev.map(p => 
          p.id === progress.id 
            ? { 
                ...p, 
                totalPoints: newTotalPoints, 
                completedTasks: newCompletedTasks,
                pendingGrade: newTotalPoints >= pointsRequired 
                  ? { subject: currentTask.subject, grade: reward?.grade || 5, pointsRequired }
                  : p.pendingGrade
              }
            : p
        ));

        // Создаём уведомление при достижении порога
        if (newTotalPoints >= pointsRequired && previousPoints < pointsRequired) {
          const notification: FipiNotification = {
            id: generateId(),
            studentId: user.id,
            studentName: user.name,
            subject: currentTask.subject,
            grade: reward?.grade || 5,
            pointsRequired,
            createdAt: today,
            acknowledged: false,
          };
          setFipiNotifications(prev => [...prev, notification]);
        }
      }
    }
  };

  // Переход к следующему заданию
  const handleNextTask = () => {
    setShowResult(false);
    setAnswer('');
    
    // Проверяем, есть ли ещё неотвеченные задания в сегодняшних
    if (pendingTasks.length > 0) {
      // Находим индекс текущего задания
      const currentIndex = todayTasks.findIndex(t => t.id === currentTask?.id);
      
      // Ищем следующее неотвеченное
      for (let i = currentIndex + 1; i < todayTasks.length; i++) {
        if (!answeredTaskIds.has(todayTasks[i].id)) {
          setCurrentTaskIndex(i);
          return;
        }
      }
      
      // Если не нашли вперёд, ищем с начала
      for (let i = 0; i < currentIndex; i++) {
        if (!answeredTaskIds.has(todayTasks[i].id)) {
          setCurrentTaskIndex(i);
          return;
        }
      }
    }
    
    // Если все задания отвечены, показываем экран завершения
  };

  // Нет заданий
  if (todayTasks.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Ежедневный тренажёр ФИПИ</h3>
            <p className="text-sm text-gray-500">Готов к работе</p>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Задания появятся сегодня</p>
          <p className="text-sm mt-1">Проверьте позже</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Ежедневный тренажёр ФИПИ</h3>
              <p className="text-sm text-gray-500">
                {allCompleted 
                  ? 'Все выполнены' 
                  : pendingTasks.length > 0 
                    ? `${pendingTasks.length} из ${todayTasks.length} осталось`
                    : 'Завершено'}
              </p>
            </div>
          </div>
          
          {/* Прогресс по предметам */}
          <div className="flex items-center gap-4">
            {SUBJECTS.map(subject => {
              const subjProgress = getSubjectProgress(subject);
              const reward = getReward(subject);
              const points = subjProgress?.totalPoints || 0;
              const required = reward?.pointsRequired || 10;
              const percent = Math.min(100, (points / required) * 100);

              return (
                <div key={subject} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1 mx-auto relative">
                    <span className="text-xs font-bold text-gray-600">{points}</span>
                    {percent >= 100 && (
                      <Trophy className="absolute -top-1 -right-1 w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{subject}</p>
                </div>
              );
            })}

            {/* Уведомления */}
            {fipiNotifications.filter(n => n.studentId === user.id && !n.acknowledged).length > 0 && (
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 bg-amber-100 rounded-xl hover:bg-amber-200 transition-colors"
              >
                <Award className="w-5 h-5 text-amber-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {fipiNotifications.filter(n => n.studentId === user.id && !n.acknowledged).length}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Прогресс текущего задания */}
        {currentTask && todayTasks.length > 0 && (
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${((todayTasks.length - pendingTasks.length) / todayTasks.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-500">{todayTasks.length - pendingTasks.length}/{todayTasks.length}</span>
          </div>
        )}
      </div>

      {/* Текущее задание - показываем только если есть неотвеченные задания и данные загружены */}
      {currentTask && !allCompleted && pendingTasks.length > 0 && todayTasks.length > 0 && (
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              currentTask.subject === 'Математика' ? 'bg-blue-100 text-blue-700' :
              currentTask.subject === 'Русский язык' ? 'bg-green-100 text-green-700' :
              currentTask.subject === 'Обществознание' ? 'bg-purple-100 text-purple-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {currentTask.subject}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              currentTask.type === 'text' ? 'bg-gray-100 text-gray-700' :
              currentTask.type === 'single' ? 'bg-cyan-100 text-cyan-700' :
              'bg-orange-100 text-orange-700'
            }`}>
              {currentTask.type === 'text' ? 'Краткий ответ' : currentTask.type === 'single' ? 'Одиночный выбор' : 'Множественный выбор'}
            </span>
          </div>

          <div className="mb-4">
            <p className="text-lg font-medium text-gray-900">{currentTask.question}</p>
            {currentTask.image && (
              <button
                onClick={() => setShowImageModal(currentTask.image!)}
                className="mt-3 relative inline-block"
              >
                <img 
                  src={currentTask.image} 
                  alt="Изображение к заданию" 
                  className="max-w-xs max-h-48 rounded-lg border cursor-zoom-in hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 rounded-lg transition-opacity">
                  <Eye className="w-8 h-8 text-white" />
                </div>
              </button>
            )}
          </div>

          {/* Варианты ответа - показываем только если результат еще не показан */}
          {!showResult && pendingTasks.length > 0 && (
            <div className="space-y-3">
              {currentTask.type === 'text' && (
                <input
                  type="text"
                  value={answer as string}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Введите ответ..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                />
              )}

              {currentTask.type === 'single' && currentTask.options && (
                <div className="space-y-2">
                  {currentTask.options.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setAnswer(option.id)}
                      className={`w-full px-4 py-3 text-left rounded-xl transition-colors ${
                        answer === option.id
                          ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
                          : 'bg-gray-50 border-2 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              )}

              {currentTask.type === 'multiple' && currentTask.options && (
                <div className="space-y-2">
                  {currentTask.options.map(option => {
                    const selected = (answer as string[]).includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          const current = (answer as string[]) || [];
                          setAnswer(
                            selected 
                              ? current.filter(id => id !== option.id)
                              : [...current, option.id]
                          );
                        }}
                        className={`w-full px-4 py-3 text-left rounded-xl transition-colors ${
                          selected
                            ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
                            : 'bg-gray-50 border-2 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {selected ? '☑' : '☐'} {option.text}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={handleSubmitAnswer}
                disabled={
                  currentTask.type === 'text' 
                    ? !(answer as string).trim()
                    : currentTask.type === 'multiple'
                      ? !(answer as string[]).length
                      : !answer
                }
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Проверить ответ
              </button>
            </div>
          )}

          {/* Результат - показываем после ответа только если есть ещё задания */}
          {showResult && pendingTasks.length > 0 && (
            <div className={`rounded-xl p-6 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-3 mb-4">
                {isCorrect ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
                <div>
                  <p className={`font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {isCorrect ? 'Правильно!' : 'Неправильно'}
                  </p>
                  {!isCorrect && (
                    <p className="text-sm text-gray-600">
                      Правильный ответ: {
                        currentTask.type === 'text' 
                          ? currentTask.correctAnswer
                          : currentTask.type === 'single'
                            ? currentTask.options?.find(o => o.id === currentTask.correctOptionId)?.text
                            : currentTask.options?.filter(o => (currentTask.correctAnswer as string[]).includes(o.id)).map(o => o.text).join(', ')
                      }
                    </p>
                  )}
                </div>
              </div>
              
              {/* Кнопка перехода - только если есть ещё неотвеченные задания */}
              {answeredTaskIds.size < todayTasks.length && (
                <button
                  onClick={handleNextTask}
                  className="w-full py-3 bg-white border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  Следующее задание
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
              
              {/* Если это было последнее задание - показываем только когда все задания отвечены */}
              {answeredTaskIds.size >= todayTasks.length && (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">Это было последнее задание на сегодня</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Все задания выполнены */}
      {allCompleted && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-8 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-amber-500" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Отлично!</h3>
          <p className="text-gray-600 mb-4">Все задания на сегодня выполнены</p>
          
          {/* Таймер до новых заданий */}
          <div className="bg-white/80 rounded-xl p-4 inline-block">
            <p className="text-sm text-gray-500 mb-1">Новые задания через:</p>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900 font-mono">{timeUntilTomorrow}</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">Возвращайтесь завтра</p>
        </div>
      )}

      {/* Все задания отвечены (есть неправильные) */}
      {!allCompleted && pendingTasks.length === 0 && todayTasks.length > 0 && (
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border border-gray-200 p-8 text-center">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Задания завершены</h3>
          <p className="text-gray-600 mb-4">Вы ответили на все задания на сегодня</p>
          
          {/* Таймер до новых заданий */}
          <div className="bg-white/80 rounded-xl p-4 inline-block">
            <p className="text-sm text-gray-500 mb-1">Новые задания через:</p>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900 font-mono">{timeUntilTomorrow}</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">Возвращайтесь завтра</p>
        </div>
      )}

      {/* Модальное окно изображения */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            onClick={() => setShowImageModal(null)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img 
            src={showImageModal} 
            alt="Изображение" 
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Модальное окно уведомлений */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Ваши достижения</h3>
              <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {fipiNotifications.filter(n => n.studentId === user.id).map(notif => (
                <div key={notif.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                  <Award className="w-8 h-8 text-amber-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Оценка {notif.grade} по {notif.subject}
                    </p>
                    <p className="text-sm text-gray-500">Набрано {notif.pointsRequired} баллов</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
