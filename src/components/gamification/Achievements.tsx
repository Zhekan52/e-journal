import React, { useState, useMemo } from 'react';
import { useData } from '../../context';
import { type Achievement, type StudentAchievement, RARITY_COLORS, defaultAchievements, getLevelByPoints, getLevelProgress } from '../../data';
import { ProgressBar } from './ProgressBar';
import { Trophy, Star, Award, Lock, Check, X, Sparkles, Crown, Zap, Target, Flame, Gift, MessageCircle, Calendar, BookOpen, GraduationCap, TrendingUp, Clock, Moon, Sun, Users, Heart, Shield, Rocket } from 'lucide-react';

interface AchievementsPanelProps {
  studentId: string;
  onClose?: () => void;
  className?: string;
}

export const AchievementsPanel: React.FC<AchievementsPanelProps> = ({
  studentId,
  onClose,
  className = '',
}) => {
  const { achievements, studentAchievements, studentLevels, grades, testAttempts, fipiProgress, fipiAttempts, chatMessages } = useData();
  
  // Используем дефолтные достижения если в базе пусто
  const allAchievements = achievements.length > 0 ? achievements : defaultAchievements;
  
  // Получаем достижения ученика
  const myAchievements = useMemo(() => {
    return studentAchievements.filter(sa => sa.studentId === studentId);
  }, [studentAchievements, studentId]);
  
  // Получаем уровень ученика
  const myLevel = useMemo(() => {
    return studentLevels.find(sl => sl.studentId === studentId);
  }, [studentLevels, studentId]);
  
  // Считаем статистику для проверки достижений
  const stats = useMemo(() => {
    const myGrades = grades.filter(g => g.studentId === studentId);
    const myTests = testAttempts.filter(ta => ta.studentId === studentId);
    const myFipiProgress = fipiProgress.find(fp => fp.studentId === studentId);
    const myFipiAttempts = fipiAttempts.filter(fa => fa.studentId === studentId);
    const myChatMessages = chatMessages.filter(cm => cm.fromUserId === studentId);
    
    // Считаем оценки 5
    const grade5Count = myGrades.filter(g => g.value === 5).length;
    
    // Средний балл
    const avgGrade = myGrades.length > 0 
      ? myGrades.reduce((sum, g) => sum + g.value, 0) / myGrades.length 
      : 0;
    
    // Количество тестов
    const testCount = myTests.length;
    
    // Количество FIPI заданий
    const fipiTasksCount = myFipiAttempts.length;
    
    // Баллы FIPI
    const fipiPoints = myFipiProgress?.totalPoints || 0;
    
    // Сообщения в чате
    const chatCount = myChatMessages.length;
    
    return {
      grade5Count,
      avgGrade,
      testCount,
      fipiTasksCount,
      fipiPoints,
      chatCount,
      totalAchievements: myAchievements.length,
    };
  }, [grades, testAttempts, fipiProgress, fipiAttempts, chatMessages, studentId, myAchievements]);
  
  // Проверяем, какие достижения получены
  const earnedAchievementIds = useMemo(() => {
    return new Set(myAchievements.map(ma => ma.achievementId));
  }, [myAchievements]);
  
  // Группируем достижения по категориям
  const achievementsByCategory = useMemo(() => {
    const categories = {
      streak: { title: 'Серии', icon: <Flame className="w-4 h-4" />, items: [] as Achievement[] },
      tasks: { title: 'Задания', icon: <Target className="w-4 h-4" />, items: [] as Achievement[] },
      grades: { title: 'Оценки', icon: <GraduationCap className="w-4 h-4" />, items: [] as Achievement[] },
      fipi: { title: 'FIPI', icon: <BookOpen className="w-4 h-4" />, items: [] as Achievement[] },
      points: { title: 'Баллы', icon: <Star className="w-4 h-4" />, items: [] as Achievement[] },
      social: { title: 'Общение', icon: <MessageCircle className="w-4 h-4" />, items: [] as Achievement[] },
      special: { title: 'Особые', icon: <Sparkles className="w-4 h-4" />, items: [] as Achievement[] },
    };
    
    allAchievements.forEach(achievement => {
      if (categories[achievement.category]) {
        categories[achievement.category].items.push(achievement);
      }
    });
    
    return categories;
  }, [allAchievements]);
  
  // Сортируем достижения: полученные первыми
  const sortAchievements = (items: Achievement[]) => {
    return [...items].sort((a, b) => {
      const aEarned = earnedAchievementIds.has(a.id);
      const bEarned = earnedAchievementIds.has(b.id);
      if (aEarned && !bEarned) return -1;
      if (!aEarned && bEarned) return 1;
      // Сортировка по редкости
      const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
  };
  
  // Подсчет прогресса для каждого достижения
  const getProgress = (achievement: Achievement): number => {
    const earned = earnedAchievementIds.has(achievement.id);
    if (earned) return achievement.requirement;
    
    let current = 0;
    switch (achievement.type) {
      case 'grade_5_count_5':
      case 'grade_5_count_10':
      case 'grade_5_count_25':
      case 'grade_5_count_50':
      case 'grade_5_count_100':
        current = stats.grade5Count;
        break;
      case 'first_test':
      case 'quiz_wizard':
      case 'test_master':
        current = stats.testCount;
        break;
      case 'tasks_10':
      case 'tasks_50':
      case 'tasks_100':
      case 'tasks_500':
      case 'tasks_1000':
        current = stats.fipiTasksCount;
        break;
      case 'points_100':
      case 'points_500':
      case 'points_1000':
      case 'points_5000':
      case 'points_10000':
        current = stats.fipiPoints;
        break;
      case 'average_above_4_5':
      case 'average_above_4_8':
      case 'average_above_5':
        current = stats.avgGrade >= (achievement.type === 'average_above_5' ? 5 : achievement.type === 'average_above_4_8' ? 4.8 : 4.5) ? 1 : 0;
        break;
      case 'social_butterfly':
        current = stats.chatCount;
        break;
      case 'achievement_hunter':
      case 'achievement_master':
      case 'achievement_legend':
        current = stats.totalAchievements;
        break;
      default:
        current = 0;
    }
    
    return Math.min(current, achievement.requirement);
  };
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const filteredAchievements = selectedCategory 
    ? achievementsByCategory[selectedCategory as keyof typeof achievementsByCategory]?.items || []
    : allAchievements;
  
  return (
    <div className={`bg-white rounded-3xl shadow-soft overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-7 h-7" />
              Достижения
            </h2>
            <p className="text-white/80 mt-1">
              {myAchievements.length} из {allAchievements.length} получено
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold">
              {myLevel?.level || 1}
            </div>
            <div className="text-sm mt-1 font-medium">Уровень</div>
          </div>
        </div>
        
        {/* XP Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{myLevel?.rank || 'Новичок'}</span>
            <span>{myLevel?.currentPoints || 0} XP</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${getLevelProgress(myLevel?.currentPoints || 0)}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Category Tabs */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === null 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Все ({allAchievements.length})
          </button>
          {Object.entries(achievementsByCategory).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                selectedCategory === key 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.icon}
              {category.title} ({category.items.length})
            </button>
          ))}
        </div>
      </div>
      
      {/* Achievements Grid */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortAchievements(filteredAchievements).map(achievement => {
            const earned = earnedAchievementIds.has(achievement.id);
            const progress = getProgress(achievement);
            const progressPercent = (progress / achievement.requirement) * 100;
            const rarityStyles = RARITY_COLORS[achievement.rarity];
            
            return (
              <div
                key={achievement.id}
                className={`relative p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] ${
                  earned 
                    ? `${rarityStyles.bg} ${rarityStyles.border} shadow-${rarityStyles.glow}` 
                    : 'bg-gray-50 border-gray-200 opacity-70'
                }`}
              >
                {/* Lock/Check overlay */}
                {!earned && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                {earned && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                )}
                
                {/* Icon */}
                <div className={`text-3xl mb-2 ${!earned ? 'grayscale' : ''}`}>
                  {achievement.icon}
                </div>
                
                {/* Title */}
                <h3 className={`font-bold text-sm mb-1 ${earned ? rarityStyles.text : 'text-gray-600'}`}>
                  {achievement.title}
                </h3>
                
                {/* Description */}
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                  {achievement.description}
                </p>
                
                {/* Progress bar (if not earned) */}
                {!earned && progress > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {progress} / {achievement.requirement}
                    </div>
                  </div>
                )}
                
                {/* Points */}
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-3 h-3 text-amber-500" />
                  <span className="text-xs font-medium text-amber-600">+{achievement.points} XP</span>
                </div>
                
                {/* Rarity badge */}
                <div className={`absolute bottom-2 right-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  achievement.rarity === 'legendary' ? 'bg-amber-200 text-amber-800' :
                  achievement.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                  achievement.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {achievement.rarity}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Stats Summary */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.grade5Count}</div>
            <div className="text-xs text-gray-500">Пятёрок</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.fipiTasksCount}</div>
            <div className="text-xs text-gray-500">Заданий FIPI</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.avgGrade.toFixed(1)}</div>
            <div className="text-xs text-gray-500">Ср. балл</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Компактное отображение достижений (для главной страницы)
interface AchievementsSummaryProps {
  studentId: string;
  className?: string;
}

export const AchievementsSummary: React.FC<AchievementsSummaryProps> = ({
  studentId,
  className = '',
}) => {
  const { achievements, studentAchievements, studentLevels } = useData();
  
  const allAchievements = achievements.length > 0 ? achievements : defaultAchievements;
  const myAchievements = studentAchievements.filter(sa => sa.studentId === studentId);
  const myLevel = studentLevels.find(sl => sl.studentId === studentId);
  
  const recentAchievements = myAchievements
    .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
    .slice(0, 3);
  
  const earnedIds = new Set(myAchievements.map(ma => ma.achievementId));
  
  return (
    <div className={`glass rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Достижения
        </h3>
        <span className="text-sm text-gray-500">
          {myAchievements.length}/{allAchievements.length}
        </span>
      </div>
      
      {/* Level indicator */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
          {myLevel?.level || 1}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{myLevel?.rank || 'Новичок'}</div>
          <div className="text-xs text-gray-500">{myLevel?.currentPoints || 0} XP</div>
        </div>
      </div>
      
      {/* Recent achievements */}
      {recentAchievements.length > 0 ? (
        <div className="space-y-2">
          {recentAchievements.map(ra => {
            const achievement = allAchievements.find(a => a.id === ra.achievementId);
            if (!achievement) return null;
            
            return (
              <div 
                key={ra.id}
                className="flex items-center gap-2 p-2 bg-green-50 rounded-lg"
              >
                <span className="text-xl">{achievement.icon}</span>
                <span className="text-sm font-medium text-gray-800 flex-1">
                  {achievement.title}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-400">
          <Award className="w-8 h-8 mx-auto mb-1 opacity-50" />
          <p className="text-sm">Пока нет достижений</p>
          <p className="text-xs">Начни учиться, чтобы получить первые!</p>
        </div>
      )}
      
      {/* Progress to next achievement */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <ProgressBar
          value={myAchievements.length}
          max={allAchievements.length}
          showPercent
          height="sm"
          color="primary"
        />
      </div>
    </div>
  );
};

export default AchievementsPanel;
