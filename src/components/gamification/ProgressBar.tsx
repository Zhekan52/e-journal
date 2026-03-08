import React from 'react';

interface ProgressBarProps {
  /** Текущее значение (прогресс) */
  value: number;
  /** Максимальное значение */
  max?: number;
  /** Показывать процент */
  showPercent?: boolean;
  /** Показывать текст (например "5/10") */
  showText?: string;
  /** Высота прогресс-бара */
  height?: 'sm' | 'md' | 'lg';
  /** Цветовая схема */
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'gradient';
  /** Анимировать заполнение */
  animated?: boolean;
  /** Показать полоску достижения цели */
  showMilestone?: boolean;
  /** Дополнительные классы */
  className?: string;
  /** Название прогресс-бара */
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showPercent = true,
  showText,
  height = 'md',
  color = 'gradient',
  animated = true,
  showMilestone = false,
  className = '',
  label,
}) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-3',
    lg: 'h-5',
  };

  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    gradient: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500',
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showText && (
            <span className="text-sm font-semibold text-gray-900">{showText}</span>
          )}
        </div>
      )}
      <div className={`w-full ${heightClasses[height]} bg-gray-200 rounded-full overflow-hidden`}>
        <div
          className={`${heightClasses[height]} ${colorClasses[color]} rounded-full transition-all duration-500 ${
            animated ? 'animate-pulse-slow' : ''
          } ${showMilestone && percent >= 100 ? 'shadow-lg shadow-green-400/50' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showPercent && !showText && (
        <div className="flex justify-end mt-1">
          <span className="text-xs font-medium text-gray-500">{Math.round(percent)}%</span>
        </div>
      )}
    </div>
  );
};

// Прогресс-бар с несколькими сегментами
interface MultiProgressBarProps {
  segments: { value: number; color: string; label?: string }[];
  max?: number;
  height?: 'sm' | 'md' | 'lg';
  showLegend?: boolean;
  className?: string;
}

export const MultiProgressBar: React.FC<MultiProgressBarProps> = ({
  segments,
  max = 100,
  height = 'md',
  showLegend = true,
  className = '',
}) => {
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-3',
    lg: 'h-5',
  };

  return (
    <div className={className}>
      <div className={`w-full ${heightClasses[height]} bg-gray-200 rounded-full overflow-hidden flex`}>
        {segments.map((segment, index) => {
          const percent = Math.min(100, Math.max(0, (segment.value / max) * 100));
          return (
            <div
              key={index}
              className={`${heightClasses[height]} ${segment.color} rounded-full first:rounded-l-full last:rounded-r-full`}
              style={{ width: `${percent}%` }}
            />
          );
        })}
      </div>
      {showLegend && segments.some(s => s.label) && (
        <div className="flex flex-wrap gap-3 mt-2">
          {segments.map((segment, index) => (
            segment.label && (
              <div key={index} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${segment.color.replace('bg-', 'bg-')}`} style={{ backgroundColor: getColorHex(segment.color) }} />
                <span className="text-xs text-gray-600">{segment.label}</span>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

// Вспомогательная функция для получения цвета
function getColorHex(colorClass: string): string {
  const colors: Record<string, string> = {
    'bg-blue-500': '#3b82f6',
    'bg-green-500': '#22c55e',
    'bg-yellow-500': '#eab308',
    'bg-red-500': '#ef4444',
    'bg-purple-500': '#a855f7',
    'bg-pink-500': '#ec4899',
    'bg-indigo-500': '#6366f1',
  };
  return colors[colorClass] || '#6b7280';
}

// Прогресс уровня (XP bar)
interface LevelProgressProps {
  currentPoints: number;
  level: number;
  rank: string;
  rankColor: string;
  nextLevelPoints?: number;
  className?: string;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({
  currentPoints,
  level,
  rank,
  rankColor,
  nextLevelPoints,
  className = '',
}) => {
  const progress = nextLevelPoints 
    ? ((currentPoints % 500) / 500) * 100 // Предполагаем, что каждый уровень требует ~500 очков
    : 100;

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-soft ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-amber-500/20">
          {level}
        </div>
        <div className="flex-1">
          <div className={`font-bold text-lg ${rankColor}`}>{rank}</div>
          <div className="text-sm text-gray-500">{currentPoints} XP</div>
        </div>
      </div>
      <div className="relative">
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        {nextLevelPoints && (
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-amber-400 shadow-sm" />
        )}
      </div>
      {nextLevelPoints && (
        <div className="text-xs text-gray-500 mt-1.5 text-center">
          {nextLevelPoints - currentPoints} XP до следующего уровня
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
