import React, { useState, useMemo, useEffect } from 'react';
import { useAuth, useData } from '../context';
import { SUBJECTS, getTodayString, getTodayDate } from '../data';
import type { FipiTask, FipiStudentProgress, FipiTaskAttempt, FipiReward, FipiNotification } from '../data';
import {
  Brain, CheckCircle, XCircle, ChevronRight, Award, Clock, RefreshCw,
  Image as ImageIcon, Eye, X, Star, Trophy, Target
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

  const today = getTodayString();

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

  // Генерация заданий на день
  useEffect(() => {
    if (!user || user.role !== 'student') return;

    SUBJECTS.forEach(subject => {
      const progress = getSubjectProgress(subject);
      const subjectTasks = fipiTasks.filter(t => t.subject === subject);
      const completedIds = progress?.completedTasks || [];
      
      // Доступные задания (не выполненные)
      const availableTasks = subjectTasks.filter(t => !completedIds.includes(t.id));
      
      // Если есть доступные задания, выбираем случайное
      let newTodayTask: FipiTask | null = null;
      if (availableTasks.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableTasks.length);
        newTodayTask = availableTasks[randomIndex];
      }

      // Обновляем прогресс
      if (progress) {
        const todayTasksIds = progress.todayTasks || [];
        const lastDate = progress.lastTaskDate;

        // Если новый день, сбрасываем задания
        if (lastDate !== today) {
          const newTodayTasks = newTodayTask ? [newTodayTask.id] : [];
          setFipiProgress(fipiProgress.map(p => 
            p.id === progress.id 
              ? { ...p, lastTaskDate: today, todayTasks: newTodayTasks }
              : p
          ));
        } else if (newTodayTask && !todayTasksIds.includes(newTodayTask.id)) {
          // Добавляем новое задание, если ещё не добавлено
          setFipiProgress(fipiProgress.map(p => 
            p.id === progress.id 
              ? { ...p, todayTasks: [...todayTasksIds, newTodayTask!.id] }
              : p
          ));
        }
      }
    });
  }, [fipiTasks]);

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

    // Обновляем прогресс
    if (progress) {
      let newTotalPoints = progress.totalPoints;
      let newCompletedTasks = [...progress.completedTasks];

      if (correct && !progress.completedTasks.includes(currentTask.id)) {
        newTotalPoints += 1;
        newCompletedTasks.push(currentTask.id);
      }

      // Проверяем порог для оценки
      const reward = getReward(currentTask.subject);
      const pointsRequired = reward?.pointsRequired || 10;
      const pendingGrade = newTotalPoints >= pointsRequired 
        ? { subject: currentTask.subject, grade: reward?.grade || 5, pointsRequired }
        : undefined;

      setFipiProgress(fipiProgress.map(p => 
        p.id === progress.id 
          ? { 
              ...p, 
              totalPoints: newTotalPoints, 
              completedTasks: newCompletedTasks,
              pendingGrade
            }
          : p
      ));

      // Создаём уведомление при достижении порога
      if (correct && newTotalPoints >= pointsRequired && (!reward || progress.totalPoints < pointsRequired)) {
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
        setFipiNotifications([...fipiNotifications, notification]);
      }
    }
  };

  // Переход к следующему заданию
  const handleNextTask = () => {
    setShowResult(false);
    setAnswer(currentTask.type === 'multiple' ? [] : '');
    if (currentTaskIndex < todayTasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      setCurrentTaskIndex(0);
    }
  };

  // Если не ученик - не показываем виджет
  if (!user || user.role !== 'student') return null;

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

  // Проверяем, все ли задания выполнены
  const allCompleted = todayTasks.every(task => {
    const taskAttempt = fipiAttempts.find(a => 
      a.taskId === task.id && a.studentId === user.id && a.date === today
    );
    return taskAttempt?.correct;
  });

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
              <p className="text-sm text-gray-500">{todayTasks.length} заданий на сегодня</p>
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
                  <p className="text-xs text-gray-500 truncate w-14">{subject.slice(0, 6)}</p>
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
        {currentTask && (
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${((currentTaskIndex + 1) / todayTasks.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-500">{currentTaskIndex + 1}/{todayTasks.length}</span>
          </div>
        )}
      </div>

      {/* Текущее задание */}
      {currentTask && !allCompleted && (
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

          {/* Варианты ответа */}
          {!showResult && (
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

          {/* Результат */}
          {showResult && (
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
              <button
                onClick={handleNextTask}
                className="w-full py-3 bg-white border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                {currentTaskIndex < todayTasks.length - 1 ? 'Следующее задание' : 'К первому заданию'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Все задания выполнены */}
      {allCompleted && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-8 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-amber-500" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Отлично!</h3>
          <p className="text-gray-600">Вы выполнили все задания на сегодня</p>
          <p className="text-sm text-gray-500 mt-2">Возвращайтесь завтра за новыми заданиями</p>
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
