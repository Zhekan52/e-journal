import React, { useState, useMemo } from 'react';
import { useAuth, useData } from '../../context';
import { ProgressBar, LevelProgress } from './ProgressBar';
import { AchievementsPanel, AchievementsSummary } from './Achievements';
import { Leaderboard, LeaderboardSummary } from './Leaderboard';
import { getLevelByPoints, getLevelProgress, getPointsToNextLevel, LEVELS, defaultAchievements } from '../../data';
import { 
  Trophy, Star, Award, Target, Flame, Zap, Crown, Medal, TrendingUp, 
  Calendar, BookOpen, GraduationCap, MessageCircle, Clock, Sun, Moon,
  ChevronRight, X, Sparkles, Gift, Users, BarChart3
} from 'lucide-react';

type GamificationTab = 'overview' | 'achievements' | 'leaderboard' | 'stats';

interface GamificationPanelProps {
  className?: string;
}

export const GamificationPanel: React.FC<GamificationPanelProps> = ({
  className = '',
}) => {
  const { user } = useAuth();
  const { 
    achievements, studentAchievements, studentLevels, studentRatings,
    grades, testAttempts, fipiProgress, fipiAttempts, chatMessages, students
  } = useData();
  
  const [activeTab, setActiveTab] = useState<GamificationTab>('overview');
  const [isExpanded, setIsExpanded] = useState(true);
  
  const studentId = user?.id || '';
  
  // Используем дефолтные достижения если в базе пусто
  const allAchievements = achievements.length > 0 ? achievements : defaultAchievements;
  
  // Получаем данные ученика
  const myAchievements = useMemo(() => 
    studentAchievements.filter(sa => sa.studentId === studentId),
    [studentAchievements, studentId]
  );
  
  const myLevel = useMemo(() => 
    studentLevels.find(sl => sl.studentId === studentId),
    [studentLevels, studentId]
  );
  
  const myRating = useMemo(() => 
    studentRatings.find(r => r.studentId === studentId && r.period === 'all'),
    [studentRatings, studentId]
  );
  
  // Вычисляем статистику
  const stats = useMemo(() => {
    const myGrades = grades.filter(g => g.studentId === studentId);
    const myTests = testAttempts.filter(ta => ta.studentId === studentId);
    const myFipiProgress = fipiProgress.find(fp => fp.studentId === studentId);
    const myFipiAttempts = fipiAttempts.filter(fa => fa.studentId === studentId);
    const myChatMessages = chatMessages.filter(cm => cm.fromUserId === studentId);
    
    // Количество пятёрок
    const grade5Count = myGrades.filter(g => g.value === 5).length;
    
    // Средний балл
    const avgGrade = myGrades.length > 0 
      ? myGrades.reduce((sum, g) => sum + g.value, 0) / myGrades.length 
      : 0;
    
    // Количество FIPI заданий
    const fipiTasksCount = myFipiAttempts.length;
    
    // Баллы FIPI
    const fipiPoints = myFipiProgress?.totalPoints || 0;
    
    // Общее количество очков (сумма всех источников)
    const totalPoints = (myLevel?.totalPoints || 0) + fipiPoints;
    
    // Текущий уровень
    const levelInfo = getLevelByPoints(totalPoints);
    
    return {
      grade5Count,
      avgGrade,
      testCount: myTests.length,
      fipiTasksCount,
      fipiPoints,
      chatCount: myChatMessages.length,
      totalPoints,
      levelInfo,
      achievementsCount: myAchievements.length,
    };
  }, [grades, testAttempts, fipiProgress, fipiAttempts, chatMessages, studentId, myLevel, myAchievements]);
  
  const tabs: { id: GamificationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Обзор', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'achievements', label: 'Достижения', icon: <Trophy className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Рейтинг', icon: <Medal className="w-4 h-4" /> },
    { id: 'stats', label: 'Статистика', icon: <TrendingUp className="w-4 h-4" /> },
  ];
  
  return (
    <div className={`bg-white rounded-3xl shadow-soft overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Геймификация</h2>
              <p className="text-white/70 text-xs">Отслеживай свой прогресс</p>
            </div>
          </div>
          
          {/* Level Badge */}
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-xl px-3 py-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
              {stats.levelInfo.level}
            </div>
            <div>
              <div className={`text-sm font-bold ${stats.levelInfo.color}`}>
                {stats.levelInfo.rank}
              </div>
              <div className="text-xs text-white/70">{stats.totalPoints} XP</div>
            </div>
          </div>
        </div>
        
        {/* Progress to next level */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-white/80 mb-1">
            <span>Прогресс до следующего уровня</span>
            <span>{getLevelProgress(stats.totalPoints)}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${getLevelProgress(stats.totalPoints)}%` }}
            />
          </div>
          {stats.levelInfo.nextLevel && (
            <div className="text-xs text-white/60 mt-1 text-right">
              {getPointsToNextLevel(stats.totalPoints)} XP до уровня {stats.levelInfo.nextLevel.level}
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-3 text-center border border-amber-100">
                <Trophy className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                <div className="text-xl font-bold text-gray-900">{stats.achievementsCount}</div>
                <div className="text-xs text-gray-500">Достижений</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 text-center border border-green-100">
                <Target className="w-5 h-5 mx-auto text-green-500 mb-1" />
                <div className="text-xl font-bold text-gray-900">{stats.fipiTasksCount}</div>
                <div className="text-xs text-gray-500">Заданий FIPI</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 text-center border border-blue-100">
                <Star className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                <div className="text-xl font-bold text-gray-900">{stats.grade5Count}</div>
                <div className="text-xs text-gray-500">Пятёрок</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-3 text-center border border-purple-100">
                <Flame className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                <div className="text-xl font-bold text-gray-900">{myRating?.streakDays || 0}</div>
                <div className="text-xs text-gray-500">Дней серии</div>
              </div>
            </div>
            
            {/* Level Progress */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold text-gray-900">Текущий уровень</span>
                </div>
                <span className={`font-bold text-lg ${stats.levelInfo.color}`}>
                  {stats.levelInfo.rank}
                </span>
              </div>
              <ProgressBar
                value={stats.totalPoints}
                max={stats.levelInfo.nextLevel?.minPoints || stats.totalPoints + 500}
                showPercent
                height="md"
                color="gradient"
              />
            </div>
            
            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab('achievements')}
                className="flex items-center justify-center gap-2 p-3 bg-primary-50 rounded-xl text-primary-700 font-medium hover:bg-primary-100 transition-colors"
              >
                <Award className="w-5 h-5" />
                Все достижения
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className="flex items-center justify-center gap-2 p-3 bg-amber-50 rounded-xl text-amber-700 font-medium hover:bg-amber-100 transition-colors"
              >
                <Medal className="w-5 h-5" />
                Таблица лидеров
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'achievements' && (
          <AchievementsPanel studentId={studentId} />
        )}
        
        {activeTab === 'leaderboard' && (
          <Leaderboard limit={10} showPeriodToggle />
        )}
        
        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* Detailed Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-medium">Оценки</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Всего оценок</span>
                    <span className="text-sm font-bold">{grades.filter(g => g.studentId === studentId).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Пятёрок</span>
                    <span className="text-sm font-bold text-green-600">{stats.grade5Count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Средний балл</span>
                    <span className="text-sm font-bold">{stats.avgGrade.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-medium">FIPI</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Заданий</span>
                    <span className="text-sm font-bold">{stats.fipiTasksCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Баллов</span>
                    <span className="text-sm font-bold text-purple-600">{stats.fipiPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Тестов пройдено</span>
                    <span className="text-sm font-bold">{stats.testCount}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Overall Stats */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
              <h4 className="font-semibold text-gray-900 mb-3">Общая статистика</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-violet-600">{stats.totalPoints}</div>
                  <div className="text-xs text-gray-500">Всего XP</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-violet-600">{stats.levelInfo.level}</div>
                  <div className="text-xs text-gray-500">Уровень</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-violet-600">{stats.achievementsCount}</div>
                  <div className="text-xs text-gray-500">Достижений</div>
                </div>
              </div>
            </div>
            
            {/* Ranking */}
            {myRating && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <h4 className="font-semibold text-gray-900 mb-3">Позиция в рейтинге</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                      #{myRating.position || '—'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Общий рейтинг</div>
                      <div className="text-xs text-gray-500">из {students.length} учеников</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-amber-600">{myRating.totalPoints}</div>
                    <div className="text-xs text-gray-500">баллов</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Компактная версия для главной страницы
export const GamificationWidget: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { user } = useAuth();
  const { achievements, studentAchievements, studentLevels, studentRatings, grades, fipiProgress, fipiAttempts } = useData();
  
  const studentId = user?.id || '';
  
  // Используем дефолтные достижения если в базе пусто
  const allAchievements = achievements.length > 0 ? achievements : defaultAchievements;
  
  const myAchievements = useMemo(() => 
    studentAchievements.filter(sa => sa.studentId === studentId),
    [studentAchievements, studentId]
  );
  
  const myLevel = useMemo(() => 
    studentLevels.find(sl => sl.studentId === studentId),
    [studentLevels, studentId]
  );
  
  const myRating = useMemo(() => 
    studentRatings.find(r => r.studentId === studentId && r.period === 'all'),
    [studentRatings, studentId]
  );
  
  const stats = useMemo(() => {
    const myGrades = grades.filter(g => g.studentId === studentId);
    const fipiPoints = fipiProgress.find(fp => fp.studentId === studentId)?.totalPoints || 0;
    const fipiTasksCount = fipiAttempts.filter(fa => fa.studentId === studentId).length;
    const totalPoints = (myLevel?.totalPoints || 0) + fipiPoints;
    
    return {
      totalPoints,
      levelInfo: getLevelByPoints(totalPoints),
      achievementsCount: myAchievements.length,
      fipiTasksCount,
      ratingPosition: myRating?.position,
    };
  }, [grades, fipiProgress, fipiAttempts, studentId, myLevel, myAchievements, myRating]);
  
  return (
    <div className={`glass rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          Прогресс
        </h3>
        <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-lg font-medium">
          Уровень {stats.levelInfo.level}
        </span>
      </div>
      
      {/* Level & XP */}
      <div className="flex items-center gap-3 mb-3 p-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
          {stats.levelInfo.level}
        </div>
        <div className="flex-1">
          <div className={`font-bold ${stats.levelInfo.color}`}>{stats.levelInfo.rank}</div>
          <div className="text-sm text-gray-500">{stats.totalPoints} XP</div>
        </div>
      </div>
      
      {/* Progress */}
      <ProgressBar
        value={stats.totalPoints}
        max={stats.levelInfo.nextLevel?.minPoints || stats.totalPoints + 500}
        showPercent
        height="sm"
        color="gradient"
        className="mb-3"
      />
      
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-lg font-bold text-gray-900">{stats.achievementsCount}</div>
          <div className="text-xs text-gray-500">Достижений</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-lg font-bold text-gray-900">{stats.fipiTasksCount}</div>
          <div className="text-xs text-gray-500">Заданий</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-lg font-bold text-gray-900">#{stats.ratingPosition || '—'}</div>
          <div className="text-xs text-gray-500">Рейтинг</div>
        </div>
      </div>
    </div>
  );
};

export default GamificationPanel;
