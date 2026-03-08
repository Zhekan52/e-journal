import React, { useState, useMemo } from 'react';
import { useData } from '../../context';
import { type StudentRating, LEVELS, getLevelByPoints } from '../../data';
import { Trophy, Medal, Crown, TrendingUp, TrendingDown, Minus, Users, Calendar, Star, Target, Award, Zap, Flame } from 'lucide-react';

interface LeaderboardProps {
  className?: string;
  limit?: number;
  showPeriodToggle?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  className = '',
  limit = 10,
  showPeriodToggle = true,
}) => {
  const { studentRatings, students } = useData();
  const [period, setPeriod] = useState<'all' | 'month' | 'week'>('all');
  
  // Фильтруем и сортируем рейтинг
  const sortedRatings = useMemo(() => {
    let filtered = studentRatings.filter(r => r.period === period);
    
    // Если нет данных, создаём моковые данные для демонстрации
    if (filtered.length === 0 && students.length > 0) {
      filtered = students.slice(0, 10).map((student, index) => ({
        id: `mock-${student.id}`,
        studentId: student.id,
        studentName: `${student.lastName} ${student.firstName}`,
        totalPoints: Math.max(0, 500 - index * 40 + Math.floor(Math.random() * 50)),
        level: Math.max(1, 5 - Math.floor(index / 3)),
        rank: LEVELS[Math.max(0, 4 - Math.floor(index / 3))].rank,
        tasksCompleted: Math.max(0, 50 - index * 4 + Math.floor(Math.random() * 10)),
        perfectScores: Math.max(0, 10 - index + Math.floor(Math.random() * 3)),
        averageGrade: Math.max(2, Math.min(5, 4.5 - index * 0.2 + Math.random() * 0.3)),
        streakDays: Math.max(0, 14 - index * 2 + Math.floor(Math.random() * 5)),
        achievementsCount: Math.max(0, 15 - index + Math.floor(Math.random() * 5)),
        lastUpdated: new Date().toISOString(),
        period: period as 'all',
        position: index + 1,
      }));
    }
    
    // Сортируем по очкам
    return filtered
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit)
      .map((rating, index) => ({ ...rating, position: index + 1 }));
  }, [studentRatings, students, period, limit]);
  
  // Получаем топ-3
  const top3 = sortedRatings.slice(0, 3);
  
  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-amber-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-700" />;
      default:
        return null;
    }
  };
  
  const getRankColor = (position: number) => {
    switch (position) {
      case 1:
        return 'from-amber-400 to-yellow-500';
      case 2:
        return 'from-gray-300 to-gray-400';
      case 3:
        return 'from-amber-600 to-amber-700';
      default:
        return 'from-gray-100 to-gray-200';
    }
  };
  
  return (
    <div className={`bg-white rounded-3xl shadow-soft overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-bold">Рейтинг учеников</h2>
            <p className="text-white/80 text-sm">Топ {limit} по очкам</p>
          </div>
        </div>
        
        {/* Period Toggle */}
        {showPeriodToggle && (
          <div className="flex gap-2 mt-4">
            {(['all', 'month', 'week'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  period === p
                    ? 'bg-white text-purple-700 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {p === 'all' ? 'За всё время' : p === 'month' ? 'За месяц' : 'За неделю'}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Top 3 Podium */}
      {top3.length >= 3 && (
        <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
          <div className="flex items-end justify-center gap-4">
            {/* 2nd place */}
            <div className="text-center">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getRankColor(2)} flex items-center justify-center text-white text-2xl font-bold shadow-lg mx-auto mb-2`}>
                {top3[1].studentName.split(' ')[0][0]}.
              </div>
              <div className="text-sm font-bold text-gray-800 truncate max-w-[80px] mx-auto">
                {top3[1].studentName.split(' ').slice(0, 2).join(' ')}
              </div>
              <div className="text-lg font-bold text-gray-500">{top3[1].totalPoints}</div>
              <div className="mt-2 w-16 h-24 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-xl mx-auto flex items-end justify-center pb-2">
                <Medal className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            
            {/* 1st place */}
            <div className="text-center -mt-4">
              <div className="relative">
                <Crown className="w-6 h-6 text-amber-500 absolute -top-6 left-1/2 -translate-x-1/2" />
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getRankColor(1)} flex items-center justify-center text-white text-3xl font-bold shadow-xl mx-auto mb-2 ring-4 ring-amber-400/30`}>
                  {top3[0].studentName.split(' ')[0][0]}.
                </div>
              </div>
              <div className="text-sm font-bold text-gray-800 truncate max-w-[100px] mx-auto">
                {top3[0].studentName.split(' ').slice(0, 2).join(' ')}
              </div>
              <div className="text-xl font-bold text-amber-600">{top3[0].totalPoints}</div>
              <div className="mt-2 w-20 h-32 bg-gradient-to-t from-amber-400 to-amber-300 rounded-t-xl mx-auto flex items-end justify-center pb-3">
                <Crown className="w-8 h-8 text-white" />
              </div>
            </div>
            
            {/* 3rd place */}
            <div className="text-center">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getRankColor(3)} flex items-center justify-center text-white text-2xl font-bold shadow-lg mx-auto mb-2`}>
                {top3[2].studentName.split(' ')[0][0]}.
              </div>
              <div className="text-sm font-bold text-gray-800 truncate max-w-[80px] mx-auto">
                {top3[2].studentName.split(' ').slice(0, 2).join(' ')}
              </div>
              <div className="text-lg font-bold text-gray-500">{top3[2].totalPoints}</div>
              <div className="mt-2 w-16 h-20 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-xl mx-auto flex items-end justify-center pb-2">
                <Medal className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Full List */}
      <div className="p-4">
        <div className="space-y-2">
          {sortedRatings.slice(0, limit).map((rating) => (
            <div
              key={rating.studentId}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01] ${
                rating.position <= 3 
                  ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {/* Position */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                rating.position === 1 ? 'bg-amber-400 text-white' :
                rating.position === 2 ? 'bg-gray-300 text-gray-700' :
                rating.position === 3 ? 'bg-amber-600 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {rating.position}
              </div>
              
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold ${
                rating.position === 1 ? 'from-amber-400 to-yellow-500' :
                rating.position === 2 ? 'from-gray-400 to-gray-500' :
                rating.position === 3 ? 'from-amber-600 to-amber-700' :
                'from-blue-400 to-indigo-500'
              }`}>
                {rating.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {rating.studentName}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {rating.tasksCompleted} заданий
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {rating.streakDays} дней
                  </span>
                </div>
              </div>
              
              {/* Level & Points */}
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-gray-900">{rating.totalPoints}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Уровень {rating.level}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {sortedRatings.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Нет данных о рейтинге</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Компактная версия рейтинга (для главной страницы)
interface LeaderboardSummaryProps {
  studentId?: string;
  className?: string;
}

export const LeaderboardSummary: React.FC<LeaderboardSummaryProps> = ({
  studentId,
  className = '',
}) => {
  const { studentRatings, students } = useData();
  
  // Находим позицию текущего ученика
  const myRating = useMemo(() => {
    if (!studentId) return null;
    return studentRatings.find(r => r.studentId === studentId && r.period === 'all');
  }, [studentRatings, studentId]);
  
  // Топ-5
  const top5 = useMemo(() => {
    return studentRatings
      .filter(r => r.period === 'all')
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 5);
  }, [studentRatings]);
  
  return (
    <div className={`glass rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Рейтинг
        </h3>
        {myRating && (
          <span className="text-sm bg-primary-100 text-primary-700 px-2 py-1 rounded-lg font-medium">
            #{myRating.position || '—'}
          </span>
        )}
      </div>
      
      {top5.length > 0 ? (
        <div className="space-y-2">
          {top5.map((rating, index) => (
            <div 
              key={rating.studentId}
              className={`flex items-center gap-2 p-2 rounded-lg ${
                rating.studentId === studentId ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                index === 0 ? 'bg-amber-400 text-white' :
                index === 1 ? 'bg-gray-300 text-gray-700' :
                index === 2 ? 'bg-amber-600 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                {rating.studentName}
              </span>
              <span className="text-sm font-bold text-amber-600">
                {rating.totalPoints}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-400">
          <p className="text-sm">Рейтинг формируется</p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
