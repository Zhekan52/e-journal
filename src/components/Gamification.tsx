import React, { useMemo } from 'react';
import { useAuth, useData } from '../context';
import { ACHIEVEMENTS, LEVELS, getLevelFromPoints, type Achievement, type StudentGamification } from '../data';
import {
  Star, Trophy, Flame, Zap, Award, CalendarCheck, BookOpen, FileText,
  Calculator, TrendingUp, GraduationCap, Lock, ChevronRight, Target,
  Medal, Crown, Gem
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Star: <Star className="w-5 h-5" />,
  Trophy: <Trophy className="w-5 h-5" />,
  Flame: <Flame className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
  Award: <Award className="w-5 h-5" />,
  CalendarCheck: <CalendarCheck className="w-5 h-5" />,
  BookOpen: <BookOpen className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
  Calculator: <Calculator className="w-5 h-5" />,
  TrendingUp: <TrendingUp className="w-5 h-5" />,
  GraduationCap: <GraduationCap className="w-5 h-5" />,
};

const rarityStyles = {
  common: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-700',
    icon: 'text-gray-500',
    glow: '',
  },
  rare: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-700',
    icon: 'text-blue-500',
    glow: 'shadow-blue-200',
  },
  epic: {
    bg: 'bg-purple-100',
    border: 'border-purple-300',
    text: 'text-purple-700',
    icon: 'text-purple-500',
    glow: 'shadow-purple-200',
  },
  legendary: {
    bg: 'bg-amber-100',
    border: 'border-amber-400',
    text: 'text-amber-700',
    icon: 'text-amber-500',
    glow: 'shadow-amber-200',
  },
};

interface AchievementCardProps {
  achievement: Achievement;
  earned: boolean;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, earned }) => {
  const style = rarityStyles[achievement.rarity];
  
  return (
    <div className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
      earned 
        ? `${style.bg} ${style.border} ${style.glow} hover:scale-105` 
        : 'bg-gray-50 border-gray-200 opacity-60'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${earned ? style.icon : 'text-gray-400'} bg-white/50`}>
          {earned ? iconMap[achievement.icon] : <Lock className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`font-bold ${earned ? style.text : 'text-gray-500'}`}>
              {achievement.title}
            </h4>
            {achievement.rarity === 'legendary' && earned && (
              <Crown className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <p className={`text-sm mt-1 ${earned ? 'text-gray-600' : 'text-gray-400'}`}>
            {achievement.description}
          </p>
          <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${earned ? style.text : 'text-gray-400'}`}>
            <Star className="w-3.5 h-3.5" />
            <span>+{achievement.points} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LevelProgressProps {
  studentGamification: StudentGamification | undefined;
}

const LevelProgress: React.FC<LevelProgressProps> = ({ studentGamification }) => {
  const points = studentGamification?.totalPoints || 0;
  const { level, title, progress, nextLevelPoints } = getLevelFromPoints(points);
  const currentLevelData = LEVELS.find(l => l.level === level);
  
  return (
    <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <span className="text-2xl font-bold">{level}</span>
          </div>
          <div>
            <div className="text-sm text-purple-200">Уровень</div>
            <div className="font-bold text-lg">{title}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{points}</div>
          <div className="text-xs text-purple-200">всего XP</div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="relative">
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-purple-200">
          <span>{currentLevelData?.points || 0} XP</span>
          <span>{nextLevelPoints} XP</span>
        </div>
      </div>
      
      {/* Next level hint */}
      {level < 10 && (
        <div className="mt-3 text-xs text-purple-200 text-center">
          До следующего уровня: {nextLevelPoints - points} XP
        </div>
      )}
    </div>
  );
};

interface StatsCardsProps {
  studentGamification: StudentGamification | undefined;
}

const StatsCards: React.FC<StatsCardsProps> = ({ studentGamification }) => {
  const earnedCount = studentGamification?.earnedAchievements.length || 0;
  const streak = studentGamification?.streakDays || 0;
  const weeklyPoints = studentGamification?.weeklyPoints || 0;
  
  const stats = [
    { 
      label: 'Достижений', 
      value: earnedCount, 
      icon: <Trophy className="w-5 h-5" />,
      color: 'from-amber-400 to-orange-500',
      shadow: 'shadow-orange-500/20'
    },
    { 
      label: 'Серия', 
      value: `${streak} дней`, 
      icon: <Flame className="w-5 h-5" />,
      color: 'from-red-400 to-pink-500',
      shadow: 'shadow-red-500/20'
    },
    { 
      label: 'За неделю', 
      value: `+${weeklyPoints} XP`, 
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-green-400 to-emerald-500',
      shadow: 'shadow-green-500/20'
    },
  ];
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="glass rounded-2xl p-4 shadow-soft hover:shadow-soft-lg transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg ${stat.shadow}`}>
              {stat.icon}
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export const GamificationWidget: React.FC = () => {
  const { user } = useAuth();
  const { gamification, grades, testAttempts, attendance, diaryEntries, students } = useData();
  
  const studentId = user?.id || '';
  
  const studentGamification = useMemo(() => {
    return gamification.find(g => g.studentId === studentId);
  }, [gamification, studentId]);
  
  const earnedAchievements = useMemo(() => {
    return studentGamification?.earnedAchievements || [];
  }, [studentGamification]);
  
  // Сгруппировать достижения по редкости
  const groupedAchievements = useMemo(() => {
    const earned = ACHIEVEMENTS.filter(a => earnedAchievements.includes(a.id));
    const locked = ACHIEVEMENTS.filter(a => !earnedAchievements.includes(a.id));
    
    // Сортируем: сначала полученные (по редкости), потом заблокированные
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    earned.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
    locked.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
    
    return { earned, locked };
  }, [earnedAchievements]);
  
  // Вычисляем прогресс для достижений
  const achievementProgress = useMemo(() => {
    const myGrades = grades.filter(g => g.studentId === studentId);
    const myTests = testAttempts.filter(t => t.studentId === studentId);
    const myAttendance = attendance.filter(a => a.studentId === studentId);
    const myDiary = diaryEntries.filter(d => d.homework);
    
    // Проверяем условия для достижений
    const progress: Record<string, number> = {};
    
    // Первая пятёрка
    const hasFive = myGrades.some(g => g.value === 5);
    progress['first_five'] = hasFive ? 100 : 0;
    
    // Первая пятёрка по математике
    const hasFiveMath = myGrades.some(g => g.value === 5 && g.subject === 'Математика');
    progress['first_five_math'] = hasFiveMath ? 100 : 0;
    
    // Серия 3
    const goodGrades = myGrades.filter(g => g.value >= 4).sort((a, b) => a.date.localeCompare(b.date));
    let maxStreak = 0;
    let currentStreak = 0;
    let lastDate = '';
    goodGrades.forEach(g => {
      if (!lastDate || g.date === lastDate) {
        currentStreak++;
      } else {
        const last = new Date(lastDate);
        const curr = new Date(g.date);
        const diffDays = Math.floor((curr.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      maxStreak = Math.max(maxStreak, currentStreak);
      lastDate = g.date;
    });
    progress['streak_3'] = Math.min(100, (maxStreak / 3) * 100);
    progress['streak_7'] = Math.min(100, (maxStreak / 7) * 100);
    
    // Перфекционист
    const perfectTests = myTests.filter(t => t.percent === 100);
    progress['perfect_test'] = perfectTests.length >= 1 ? 100 : Math.min(100, (perfectTests.length || 0) * 50);
    progress['perfect_test_3'] = perfectTests.length >= 3 ? 100 : Math.min(100, (perfectTests.length / 3) * 100);
    
    // Посещаемость
    const uniqueDates = [...new Set(myAttendance.map(a => a.date))];
    progress['attendance_week'] = Math.min(100, (uniqueDates.length / 5) * 100);
    progress['attendance_month'] = Math.min(100, (uniqueDates.length / 20) * 100);
    
    // Домашние задания (по diary entries с homework)
    progress['homework_10'] = Math.min(100, (myDiary.length / 10) * 100);
    
    // Тесты
    const passedTests = myTests.filter(t => t.grade >= 4);
    progress['tests_5'] = Math.min(100, (passedTests.length / 5) * 100);
    
    // Средний балл
    const avgGrades = myGrades.filter(g => !g.excludeFromAverage);
    const avg = avgGrades.length > 0 
      ? avgGrades.reduce((s, g) => s + g.value, 0) / avgGrades.length 
      : 0;
    progress['all_subjects_45'] = avg >= 4.5 ? 100 : Math.min(100, (avg / 4.5) * 100);
    
    // Уровень
    const points = studentGamification?.totalPoints || 0;
    progress['level_5'] = points >= LEVELS[4].points ? 100 : Math.min(100, (points / LEVELS[4].points) * 100);
    
    return progress;
  }, [grades, testAttempts, attendance, diaryEntries, studentId, studentGamification]);
  
  if (!user || user.role !== 'student') return null;
  
  return (
    <div className="space-y-6">
      {/* Level Progress */}
      <LevelProgress studentGamification={studentGamification} />
      
      {/* Stats Cards */}
      <StatsCards studentGamification={studentGamification} />
      
      {/* Achievements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Достижения</h3>
          <span className="text-sm text-gray-500">
            {earnedAchievements.length} / {ACHIEVEMENTS.length}
          </span>
        </div>
        
        {/* Earned achievements */}
        {groupedAchievements.earned.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Medal className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-gray-700">Полученные</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupedAchievements.earned.map(achievement => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement} 
                  earned={true} 
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Locked achievements with progress */}
        {groupedAchievements.locked.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">В процессе</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupedAchievements.locked.map(achievement => {
                const progress = achievementProgress[achievement.id] || 0;
                return (
                  <div key={achievement.id} className="relative">
                    <AchievementCard 
                      achievement={achievement} 
                      earned={false} 
                    />
                    {progress > 0 && progress < 100 && (
                      <div className="absolute bottom-4 right-4 w-16">
                        <div className="text-xs font-bold text-center text-gray-500 mb-1">
                          {Math.round(progress)}%
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Компонент для админской панели - просмотр прогресса всех учеников
export const AdminGamificationView: React.FC = () => {
  const { students, gamification, grades } = useData();
  
  const leaderboard = useMemo(() => {
    return students.map(student => {
      const g = gamification.find(g => g.studentId === student.id);
      const studentGrades = grades.filter(gr => gr.studentId === student.id);
      const avg = studentGrades.length > 0 
        ? studentGrades.filter(g => !g.excludeFromAverage).reduce((s, g) => s + g.value, 0) / studentGrades.filter(g => !g.excludeFromAverage).length 
        : 0;
      
      return {
        student,
        points: g?.totalPoints || 0,
        level: getLevelFromPoints(g?.totalPoints || 0),
        achievements: g?.earnedAchievements.length || 0,
        avgGrade: avg,
      };
    }).sort((a, b) => b.points - a.points);
  }, [students, gamification, grades]);
  
  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Геймификация</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl">
          <Trophy className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-amber-700">Рейтинг учеников</span>
        </div>
      </div>
      
      {/* Leaderboard */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 shadow-lg overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-gray-900">Таблица лидеров</span>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {leaderboard.map((item, index) => (
            <div 
              key={item.student.id} 
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Position */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                index === 0 
                  ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-200' 
                  : index === 1 
                    ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-lg'
                    : index === 2 
                      ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-500'
              }`}>
                {index + 1}
              </div>
              
              {/* Avatar */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                {item.student.firstName.charAt(0)}
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <div className="font-bold text-gray-900">
                  {item.student.lastName} {item.student.firstName}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500">Уровень {item.level.level}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{item.level.title}</span>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{item.points}</div>
                  <div className="text-xs text-gray-500">XP</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{item.achievements}</div>
                  <div className="text-xs text-gray-500">Наград</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold ${
                    item.avgGrade >= 4.5 ? 'text-green-600' :
                    item.avgGrade >= 3.5 ? 'text-blue-600' :
                    item.avgGrade >= 2.5 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {item.avgGrade > 0 ? item.avgGrade.toFixed(2) : '—'}
                  </div>
                  <div className="text-xs text-gray-500">Ср. балл</div>
                </div>
              </div>
            </div>
          ))}
          
          {leaderboard.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              Нет данных об учениках
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
