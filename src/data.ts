// ==================== TYPES ====================

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'student' | 'admin';
  name: string;
}

export interface Lesson {
  id: string;
  subject: string;
  date: string; // YYYY-MM-DD specific date
  lessonNumber: number;
  startTime?: string;
  endTime?: string;
}

export interface Grade {
  id: string;
  studentId: string;
  subject: string;
  value: number;
  date: string;
  lessonNumber?: number;
  columnId?: string;
  excludeFromAverage?: boolean; // Если true — не учитывается при расчёте среднего балла
  reason?: string; // Основание для оценки (за что поставлена)
}

export interface DiaryEntryAttachment {
  name: string;
  url: string;
}

// Материалы урока (для учителя) - не видны ученикам
export interface LessonMaterial {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  lessonNumber: number;
  subject: string;
  topic: string;
  homework: string;
  attachment?: DiaryEntryAttachment;
  lessonMaterials?: LessonMaterial[]; // Материалы для учителя (презентации, методички и т.д.)
  grade?: number;
  testId?: string;
  checkHomework?: boolean;
  testType?: 'real';
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  enrollmentDate?: string; // Дата прибытия в школу (YYYY-MM-DD), обязательное поле
}

export interface TestQuestion {
  id: string;
  type: 'single' | 'multiple' | 'text';
  text: string;
  image?: string;
  formula?: string;
  options: { id: string; text: string; correct: boolean }[];
  correctAnswer?: string;
  points: number;
}

export interface TestVariant {
  id: string;
  name: string; // Например: "Вариант 1", "Вариант 2"
  questions: TestQuestion[];
}

export interface Test {
  id: string;
  title: string;
  subject: string;
  timeLimit: number;
  gradingScale: { minPercent: number; grade: number }[];
  questions: TestQuestion[];
  variants: TestVariant[];
  useVariants: boolean; // true = использовать варианты, false = использовать основной список questions
  assignedLessonId?: string;
  createdAt: string;
}

export interface JournalColumn {
  id: string;
  date: string;
  subject: string;
  lessonNumber?: number;
  type: 'grade' | 'homework' | 'test';
}

export interface LessonTypeEntry {
  id: string;
  date: string;
  subject: string;
  type: string;
  lessonNumber?: number;
}

export interface TestAttempt {
  id: string;
  studentId: string;
  testId: string;
  variantId?: string; // Выбранный вариант (если используются варианты)
  date: string;
  subject: string;
  correct: number;
  total: number;
  percent: number;
  grade: number;
  completedAt: string;
  timeSpent: number; // seconds spent on test
  answers: { questionId: string; answer: string | string[]; correct: boolean }[];
}

export interface TestAssignment {
  id: string;
  studentId: string;
  testId: string;
  date: string;
  subject: string;
  lessonNumber: number;
  assigned: boolean; // true = тест назначен, false = не назначен (например, болеет)
  variantId?: string; // Назначенный вариант (если используются варианты)
  deadlineDate?: string; // Дата, до которой нужно пройти тест (если установлен - тест с дедлайном)
}

// Notifications removed

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  subject: string;
  type: 'Н' | 'УП' | 'Б' | 'ОП';
}

export const ATTENDANCE_TYPES: { value: AttendanceRecord['type']; label: string; short: string; color: string; bgColor: string }[] = [
  { value: 'Н', label: 'Неуважительная причина', short: 'Н', color: 'text-red-700', bgColor: 'bg-red-100' },
  { value: 'УП', label: 'Уважительная причина', short: 'УП', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  { value: 'Б', label: 'Болел', short: 'Б', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  { value: 'ОП', label: 'Опоздал', short: 'ОП', color: 'text-orange-700', bgColor: 'bg-orange-100' },
];

export interface CustomLessonType {
  id: string;
  value: string;
  label: string;
  color: string;
  short: string;
}

export const defaultCustomLessonTypes: CustomLessonType[] = [];

// ==================== CHAT ====================

export interface ChatMessage {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: 'student' | 'admin';
  toUserId: string;
  text: string;
  attachment?: {
    name: string;
    url: string;
  };
  createdAt: string; // ISO string
  read: boolean;
}

// ==================== FIPI TRAINER ====================

export interface FipiTask {
  id: string;
  subject: string; // Предмет: Математика, Русский язык, Обществознание, География
  type: 'text' | 'single' | 'multiple'; // Краткий ответ, одиночный выбор, множественный выбор
  question: string; // Текст вопроса
  image?: string; // URL изображения (опционально)
  options?: { id: string; text: string }[]; // Варианты ответа (для single/multiple)
  correctAnswer: string | string[]; // Правильный ответ (для text - строка, для multiple - массив id)
  correctOptionId?: string; // ID правильного варианта (для single)
  createdAt: string;
  updatedAt: string;
}

export interface FipiReward {
  id: string;
  subject: string;
  pointsRequired: number; // Количество баллов для получения оценки
  grade: number; // Оценка (4 или 5)
}

export interface FipiStudentProgress {
  id: string;
  studentId: string;
  subject: string;
  totalPoints: number; // Всего баллов заработано
  completedTasks: string[]; // ID выполненных заданий
  lastTaskDate: string; // Дата последнего задания (YYYY-MM-DD)
  todayTasks: string[]; // ID заданий на сегодня
  currentTaskIndex?: number; // Текущий индекс задания (для восстановления после перезагрузки)
  pendingGrade?: { subject: string; grade: number; pointsRequired: number }; // Ожидаемая оценка
}

export interface FipiTaskAttempt {
  id: string;
  studentId: string;
  taskId: string;
  subject: string;
  date: string;
  time?: string; // Время сдачи задания (ЧЧ:ММ)
  answer: string | string[];
  correct: boolean;
  pointsEarned: number; // 1 если верно, 0 если нет
  manuallyApproved?: boolean; // Если админ вручную засчитал
  timeSpent?: number; // Время выполнения в секундах
}

export interface FipiNotification {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  grade: number;
  pointsRequired: number;
  createdAt: string;
  acknowledged: boolean;
}

// Настройки поощрений по умолчанию
export const defaultFipiRewards: FipiReward[] = [
  { id: 'r1', subject: 'Математика', pointsRequired: 10, grade: 5 },
  { id: 'r2', subject: 'Русский язык', pointsRequired: 10, grade: 5 },
  { id: 'r3', subject: 'Обществознание', pointsRequired: 10, grade: 5 },
  { id: 'r4', subject: 'География', pointsRequired: 10, grade: 5 },
];

// ==================== GAMIFICATION ====================

// Типы достижений
export type AchievementType = 
  | 'first_login'           // Первое посещение
  | 'streak_3'              // 3 дня подряд
  | 'streak_7'              // 7 дней подряд
  | 'streak_14'             // 14 дней подряд
  | 'streak_30'             // 30 дней подряд
  | 'first_test'            // Первый тест
  | 'first_perfect_score'   // Первая "пятёрка"
  | 'perfect_streak_5'      // 5 пятёрок подряд
  | 'tasks_10'              // 10 заданий
  | 'tasks_50'              // 50 заданий
  | 'tasks_100'             // 100 заданий
  | 'tasks_500'             // 500 заданий
  | 'grade_5_count_5'       // 5 пятёрок
  | 'grade_5_count_10'      // 10 пятёрок
  | 'grade_5_count_25'      // 25 пятёрок
  | 'grade_5_count_50'      // 50 пятёрок
  | 'top_student'           // Лучший ученик
  | 'subject_master'        // Мастер предмета (10 заданий по предмету)
  | 'speed_demon'           // Быстрый ответ (менее 10 сек)
  | 'perfect_day'           // Все задания за день верно
  | 'week_warrior'          // 7 дней активности
  | 'month_master'          // 30 дней активности
  | 'homework_hero'         // 10 раз сделал ДЗ
  | 'attendance_star'       // Отличная посещаемость (месяц без пропусков)
  | 'early_bird'            // Рано утром (до 8 утра)
  | 'night_owl'             // Поздно ночью (после 22:00)
  | 'social_butterfly'      // Написал 10 сообщений в чат
  | 'quiz_wizard'           // Прошёл 10 тестов
  | 'consistency_king'      // 14 дней подряд выполнял задания FIPI
  | 'challenge_accepted'    // Выполнил 50 заданий FIPI
  | 'subject_expert'        // 100 заданий по одному предмету
  | 'average_above_4_5'     // Средний балл выше 4.5
  | 'average_above_4_8'     // Средний балл выше 4.8
  | 'average_above_5'       // Средний балл 5.0
  | 'all_subjects'          // Оценки по всем предметам
  | 'first_homework'        // Первое ДЗ
  | 'homework_master'       // 20 раз сделал ДЗ
  | 'test_master'           // 20 тестов
  | 'registration_bonus'    // Бонус за регистрацию
  | 'profile_complete'      // Профиль заполнен
  | 'streak_100'            // 100 дней подряд
  | 'streak_365'            // 365 дней подряд
  | 'tasks_1000'            // 1000 заданий
  | 'grade_5_count_100'     // 100 пятёрок
  | 'achievement_hunter'    // 10 достижений
  | 'achievement_master'    // 25 достижений
  | 'achievement_legend'    // 50 достижений
  | 'points_100'            // 100 баллов FIPI
  | 'points_500'            // 500 баллов FIPI
  | 'points_1000'           // 1000 баллов FIPI
  | 'points_5000'           // 5000 баллов FIPI
  | 'points_10000';         // 10000 баллов FIPI

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string; // emoji или название иконки
  category: 'streak' | 'tasks' | 'grades' | 'social' | 'special' | 'fipi' | 'points';
  points: number; // Баллы за достижение
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: number; // Требование для получения
  isActive: boolean; // Активно ли достижение
  createdAt: string;
}

export interface StudentAchievement {
  id: string;
  studentId: string;
  achievementId: string;
  earnedAt: string;
  progress?: number; // Текущий прогресс (если достижение не получено)
  isNew?: boolean; // Новое (не просмотренное) достижение
}

// Прогресс уровня ученика
export interface StudentLevel {
  id: string;
  studentId: string;
  level: number;
  currentPoints: number;
  totalPoints: number; // Всего баллов заработано за всё время
  rank: string; // Звание: Новичок, Ученик, Отличник и т.д.
  badges: string[]; // ID бейджей
  weeklyPoints: number; // Очки за эту неделю
  monthlyPoints: number; // Очки за этот месяц
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

// Рейтинг ученика
export interface StudentRating {
  id: string;
  studentId: string;
  studentName: string;
  totalPoints: number;
  level: number;
  rank: string;
  tasksCompleted: number;
  perfectScores: number;
  averageGrade: number;
  streakDays: number;
  achievementsCount: number;
  lastUpdated: string;
  period: 'all' | 'month' | 'week';
  position?: number; // Позиция в рейтинге
}

// Уровни и звания
export const LEVELS = [
  { level: 1, minPoints: 0, rank: 'Новичок', color: 'text-gray-500' },
  { level: 2, minPoints: 50, rank: 'Ученик', color: 'text-blue-500' },
  { level: 3, minPoints: 150, rank: 'Прилежный ученик', color: 'text-green-500' },
  { level: 4, minPoints: 350, rank: 'Отличник', color: 'text-yellow-500' },
  { level: 5, minPoints: 700, rank: 'Знаток', color: 'text-orange-500' },
  { level: 6, minPoints: 1200, rank: 'Эксперт', color: 'text-pink-500' },
  { level: 7, minPoints: 2000, rank: 'Мастер', color: 'text-purple-500' },
  { level: 8, minPoints: 3500, rank: 'Гуру', color: 'text-indigo-500' },
  { level: 9, minPoints: 5500, rank: 'Легенда', color: 'text-amber-500' },
  { level: 10, minPoints: 10000, rank: 'Чемпион', color: 'text-red-500' },
];

// Достижения по умолчанию
export const defaultAchievements: Achievement[] = [
  // Достижения за вход/активность
  { id: 'a1', type: 'first_login', title: 'Добро пожаловать!', description: 'Впервые вошёл в систему', icon: '🎉', category: 'special', points: 10, rarity: 'common', requirement: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a2', type: 'streak_3', title: 'Тройная серия', description: 'Посещай систему 3 дня подряд', icon: '🔥', category: 'streak', points: 30, rarity: 'common', requirement: 3, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a3', type: 'streak_7', title: 'Недельная серия', description: 'Посещай систему 7 дней подряд', icon: '💪', category: 'streak', points: 75, rarity: 'rare', requirement: 7, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a4', type: 'streak_14', title: 'Двухнедельная серия', description: 'Посещай систему 14 дней подряд', icon: '⭐', category: 'streak', points: 150, rarity: 'rare', requirement: 14, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a5', type: 'streak_30', title: 'Месячная серия', description: 'Посещай систему 30 дней подряд', icon: '🏆', category: 'streak', points: 300, rarity: 'epic', requirement: 30, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a6', type: 'streak_100', title: 'Стодневная серия', description: 'Посещай систему 100 дней подряд', icon: '👑', category: 'streak', points: 1000, rarity: 'legendary', requirement: 100, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a7', type: 'streak_365', title: 'Годовая серия', description: 'Посещай систему 365 дней подряд', icon: '🌟', category: 'streak', points: 5000, rarity: 'legendary', requirement: 365, isActive: true, createdAt: new Date().toISOString() },
  
  // Достижения за задания FIPI
  { id: 'a8', type: 'tasks_10', title: 'Начинающий', description: 'Выполни 10 заданий FIPI', icon: '📝', category: 'fipi', points: 25, rarity: 'common', requirement: 10, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a9', type: 'tasks_50', title: 'Практик', description: 'Выполни 50 заданий FIPI', icon: '📚', category: 'fipi', points: 100, rarity: 'rare', requirement: 50, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a10', type: 'tasks_100', title: 'Опытный', description: 'Выполни 100 заданий FIPI', icon: '🎯', category: 'fipi', points: 200, rarity: 'rare', requirement: 100, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a11', type: 'tasks_500', title: 'Мастер FIPI', description: 'Выполни 500 заданий FIPI', icon: '🧠', category: 'fipi', points: 500, rarity: 'epic', requirement: 500, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a12', type: 'tasks_1000', title: 'Гений FIPI', description: 'Выполни 1000 заданий FIPI', icon: '💎', category: 'fipi', points: 1000, rarity: 'legendary', requirement: 1000, isActive: true, createdAt: new Date().toISOString() },
  
  // Достижения за оценки
  { id: 'a13', type: 'first_perfect_score', title: 'Первая пятёрка!', description: 'Получи первую оценку 5', icon: '🌟', category: 'grades', points: 20, rarity: 'common', requirement: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a14', type: 'grade_5_count_5', title: 'Пятёрочник', description: 'Получи 5 оценок 5', icon: '📕', category: 'grades', points: 50, rarity: 'rare', requirement: 5, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a15', type: 'grade_5_count_10', title: 'Отличник', description: 'Получи 10 оценок 5', icon: '📗', category: 'grades', points: 100, rarity: 'rare', requirement: 10, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a16', type: 'grade_5_count_25', title: 'Блестящий', description: 'Получи 25 оценок 5', icon: '📘', category: 'grades', points: 250, rarity: 'epic', requirement: 25, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a17', type: 'grade_5_count_50', title: 'Гений', description: 'Получи 50 оценок 5', icon: '📙', category: 'grades', points: 500, rarity: 'epic', requirement: 50, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a18', type: 'grade_5_count_100', title: 'Легенда', description: 'Получи 100 оценок 5', icon: '🏅', category: 'grades', points: 1000, rarity: 'legendary', requirement: 100, isActive: true, createdAt: new Date().toISOString() },
  
  // Достижения за средний балл
  { id: 'a19', type: 'average_above_4_5', title: 'Хорошист', description: 'Достигни среднего балла 4.5', icon: '📈', category: 'grades', points: 75, rarity: 'rare', requirement: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a20', type: 'average_above_4_8', title: 'Почти отличник', description: 'Достигни среднего балла 4.8', icon: '📊', category: 'grades', points: 150, rarity: 'epic', requirement: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a21', type: 'average_above_5', title: 'Отличник!', description: 'Достигни среднего балла 5.0', icon: '🎓', category: 'grades', points: 300, rarity: 'legendary', requirement: 1, isActive: true, createdAt: new Date().toISOString() },
  
  // Достижения за тесты
  { id: 'a22', type: 'first_test', title: 'Первое испытание', description: 'Пройди первый тест', icon: '📋', category: 'tasks', points: 15, rarity: 'common', requirement: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a23', type: 'quiz_wizard', title: 'Тестовый маг', description: 'Пройди 10 тестов', icon: '🧪', category: 'tasks', points: 100, rarity: 'rare', requirement: 10, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a24', type: 'test_master', title: 'Мастер тестов', description: 'Пройди 20 тестов', icon: '🎓', category: 'tasks', points: 200, rarity: 'epic', requirement: 20, isActive: true, createdAt: new Date().toISOString() },
  
  // Достижения за домашние задания
  { id: 'a25', type: 'first_homework', title: 'Первое ДЗ', description: 'Выполни первое домашнее задание', icon: '🏠', category: 'tasks', points: 15, rarity: 'common', requirement: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a26', type: 'homework_hero', title: 'Герой ДЗ', description: 'Выполни 10 домашних заданий', icon: '🦸', category: 'tasks', points: 75, rarity: 'rare', requirement: 10, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a27', type: 'homework_master', title: 'Мастер ДЗ', description: 'Выполни 20 домашних заданий', icon: '🏆', category: 'tasks', points: 150, rarity: 'epic', requirement: 20, isActive: true, createdAt: new Date().toISOString() },
  
  // Достижения за посещаемость
  { id: 'a28', type: 'attendance_star', title: 'Звезда посещаемости', description: 'Посещай занятия весь месяц без пропусков', icon: '⭐', category: 'special', points: 100, rarity: 'rare', requirement: 1, isActive: true, createdAt: new Date().toISOString() },
  
  // Достижения за активность в чате
  { id: 'a29', type: 'social_butterfly', title: 'Общительный', description: 'Напиши 10 сообщений в чат', icon: '💬', category: 'social', points: 30, rarity: 'common', requirement: 10, isActive: true, createdAt: new Date().toISOString() },
  
  // Достижения за достижения
  { id: 'a30', type: 'achievement_hunter', title: 'Охотник за достижениями', description: 'Получи 10 достижений', icon: '🎖️', category: 'special', points: 100, rarity: 'rare', requirement: 10, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a31', type: 'achievement_master', title: 'Мастер достижений', description: 'Получи 25 достижений', icon: '🏅', category: 'special', points: 250, rarity: 'epic', requirement: 25, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a32', type: 'achievement_legend', title: 'Легенда достижений', description: 'Получи 50 достижений', icon: '🏆', category: 'special', points: 500, rarity: 'legendary', requirement: 50, isActive: true, createdAt: new Date().toISOString() },
  
  // Достижения за баллы FIPI
  { id: 'a33', type: 'points_100', title: 'Сто очков', description: 'Набери 100 баллов FIPI', icon: '🎯', category: 'points', points: 25, rarity: 'common', requirement: 100, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a34', type: 'points_500', title: 'Пятьсот очков', description: 'Набери 500 баллов FIPI', icon: '🎪', category: 'points', points: 100, rarity: 'rare', requirement: 500, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a35', type: 'points_1000', title: 'Тысяча', description: 'Набери 1000 баллов FIPI', icon: '🎰', category: 'points', points: 200, rarity: 'rare', requirement: 1000, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a36', type: 'points_5000', title: 'Пять тысяч', description: 'Набери 5000 баллов FIPI', icon: '🎨', category: 'points', points: 500, rarity: 'epic', requirement: 5000, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a37', type: 'points_10000', title: 'Десять тысяч', description: 'Набери 10000 баллов FIPI', icon: '🎭', category: 'points', points: 1000, rarity: 'legendary', requirement: 10000, isActive: true, createdAt: new Date().toISOString() },
  
  // Специальные достижения
  { id: 'a38', type: 'perfect_day', title: 'Идеальный день', description: 'Выполни все задания FIPI за день без ошибок', icon: '🌈', category: 'special', points: 50, rarity: 'rare', requirement: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a39', type: 'speed_demon', title: 'Скоростной', description: 'Ответь на задание менее чем за 10 секунд', icon: '⚡', category: 'special', points: 25, rarity: 'common', requirement: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a40', type: 'early_bird', title: 'Ранняя пташка', description: 'Зайди в систему до 8 утра', icon: '🌅', category: 'special', points: 15, rarity: 'common', requirement: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: 'a41', type: 'night_owl', title: 'Ночная сова', description: 'Зайди в систему после 22:00', icon: '🦉', category: 'special', points: 15, rarity: 'common', requirement: 1, isActive: true, createdAt: new Date().toISOString() },
];

// Функция получения уровня по очкам
export function getLevelByPoints(points: number): { level: number; rank: string; color: string; nextLevel?: { level: number; minPoints: number } } {
  let currentLevel = LEVELS[0];
  let nextLevel = undefined;
  
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1];
      break;
    }
  }
  
  return {
    level: currentLevel.level,
    rank: currentLevel.rank,
    color: currentLevel.color,
    nextLevel: nextLevel ? { level: nextLevel.level, minPoints: nextLevel.minPoints } : undefined
  };
}

// Функция получения прогресса до следующего уровня (в процентах)
export function getLevelProgress(points: number): number {
  const current = getLevelByPoints(points);
  if (!current.nextLevel) return 100; // Максимальный уровень
  
  const currentMinPoints = LEVELS.find(l => l.level === current.level)?.minPoints || 0;
  const nextMinPoints = current.nextLevel.minPoints;
  const pointsInLevel = points - currentMinPoints;
  const pointsNeeded = nextMinPoints - currentMinPoints;
  
  return Math.min(100, Math.round((pointsInLevel / pointsNeeded) * 100));
}

// Функция получения очков до следующего уровня
export function getPointsToNextLevel(points: number): number {
  const current = getLevelByPoints(points);
  if (!current.nextLevel) return 0;
  return current.nextLevel.minPoints - points;
}

// Rarity цвета
export const RARITY_COLORS: Record<Achievement['rarity'], { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-600', glow: 'shadow-gray-200' },
  rare: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', glow: 'shadow-blue-200' },
  epic: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700', glow: 'shadow-purple-300' },
  legendary: { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-700', glow: 'shadow-amber-300' },
};

// Количество заданий в день
export const FIPI_DAILY_TASKS = 4;

// ==================== CONSTANTS ====================

export const TIME_SLOTS = [
  { num: 1, start: '08:00', end: '08:45' },
  { num: 2, start: '08:55', end: '09:40' },
  { num: 3, start: '09:50', end: '10:35' },
  { num: 4, start: '10:55', end: '11:40' },
  { num: 5, start: '11:50', end: '12:35' },
  { num: 6, start: '12:45', end: '13:30' },
  { num: 7, start: '13:40', end: '14:25' },
];

export const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
export const DAY_NAMES_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
export const MONTH_NAMES_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

export const SUBJECTS = [
  'Математика', 'Русский язык', 'Обществознание', 'География'
];

export const LESSON_TYPE_OPTIONS: { value: string; label: string; color: string; short: string }[] = [
  { value: '', label: 'Не указан', color: 'bg-gray-100 text-gray-500', short: '' },
  { value: 'new', label: 'Новая тема', color: 'bg-blue-100 text-blue-700', short: 'НТ' },
  { value: 'consolidation', label: 'Закрепление', color: 'bg-cyan-100 text-cyan-700', short: 'Зк' },
  { value: 'practice', label: 'Практика', color: 'bg-green-100 text-green-700', short: 'Пр' },
  { value: 'lab', label: 'Лаб. работа', color: 'bg-teal-100 text-teal-700', short: 'Лр' },
  { value: 'control', label: 'Контрольная', color: 'bg-red-100 text-red-700', short: 'Кр' },
  { value: 'independent', label: 'Самост. работа', color: 'bg-orange-100 text-orange-700', short: 'Ср' },
  { value: 'test', label: 'Тест', color: 'bg-purple-100 text-purple-700', short: 'Тс' },
  { value: 'review', label: 'Повторение', color: 'bg-amber-100 text-amber-700', short: 'Пв' },
  { value: 'exam', label: 'Зачёт', color: 'bg-rose-100 text-rose-700', short: 'Зч' },
];

// ==================== USERS ====================

export const adminUsers: User[] = [
  { id: 'u2', username: 'admin', password: 'admin', role: 'admin', name: 'Директор' },
];

// ==================== STUDENTS ====================

export const initialStudents: Student[] = [];

// ==================== SCHEDULE ====================

export const initialLessons: Lesson[] = [];

// ==================== GRADES ====================

export const initialGrades: Grade[] = [];

// ==================== DIARY ENTRIES ====================

function generateDiaryEntries(): DiaryEntry[] {
  // No initial lessons, so no diary entries
  return [];
}

export const initialDiaryEntries: DiaryEntry[] = generateDiaryEntries();

// ==================== TESTS ====================

export const initialTests: Test[] = [];

// ==================== HELPERS ====================

export function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    dates.push(dd);
  }
  return dates;
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateRu(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES_GEN[date.getMonth()]}`;
}

export function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay();
  if (startDow === 0) startDow = 7;
  startDow -= 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// Получение текущей даты с учетом часового пояса UTC+7
export function getTodayDate(): Date {
  const now = new Date();
  // Создаем дату с учетом смещения UTC+7
  const offset = 7 * 60; // UTC+7 в минутах
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (offset * 60000));
}

// Получение строки даты "YYYY-MM-DD" с учетом часового пояса UTC+7
export function getTodayString(): string {
  const today = getTodayDate();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
