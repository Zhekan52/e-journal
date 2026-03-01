import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context';
import { SUBJECTS, MONTH_NAMES, MONTH_NAMES_GEN, getTodayString, getTodayDate, ATTENDANCE_TYPES } from '../data';
import {
  FileText, Calendar, Users, TrendingUp, ChevronDown, ChevronUp,
  Filter, User, BarChart3, AlertCircle, ChevronRight, ChevronLeft
} from 'lucide-react';

type ReportTab = 'student' | 'class' | 'attendance' | 'statistics';

interface DateRange {
  start: string;
  end: string;
}

// Получить дату начала учебного года (1 сентября)
function getSchoolYearStart(): string {
  const today = getTodayDate();
  const year = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
  return `${year}-09-01`;
}

// Парсинг даты
function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Формат даты для отображения
function formatDateDisplay(dateStr: string): string {
  const date = parseDate(dateStr);
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()].toLowerCase()} ${date.getFullYear()}`;
}

// Проверка даты в диапазоне
function isDateInRange(dateStr: string, range: DateRange): boolean {
  const date = dateStr;
  return date >= range.start && date <= range.end;
}

export const Reports: React.FC = () => {
  const { students, grades, attendance } = useData();
  
  const [activeTab, setActiveTab] = useState<ReportTab>('student');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: getSchoolYearStart(),
    end: getTodayString()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');

  // Сброс выбора ученика при смене вкладки
  useEffect(() => {
    setSelectedStudent('');
    setStudentSearch('');
  }, [activeTab]);

  // Автоматическая установка фильтра дат при входе на вкладку отчётов
  // Начальная дата — день выставления самой первой оценки
  // Конечная дата — день выставления последней оценки
  useEffect(() => {
    if (grades.length > 0) {
      const sortedGrades = [...grades].sort((a, b) => a.date.localeCompare(b.date));
      const firstGradeDate = sortedGrades[0]?.date;
      const lastGradeDate = sortedGrades[sortedGrades.length - 1]?.date;
      
      if (firstGradeDate && lastGradeDate) {
        setDateRange({
          start: firstGradeDate,
          end: lastGradeDate
        });
      }
    }
  }, []); // Пустой массив — выполняется только при монтировании

  const tabs: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: 'student', label: 'Табель ученика', icon: <User className="w-5 h-5" /> },
    { id: 'class', label: 'Успеваемость класса', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'statistics', label: 'Статистика', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'attendance', label: 'Пропуски', icon: <AlertCircle className="w-5 h-5" /> },
  ];

  // Отфильтрованный список учеников для поиска
  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    const search = studentSearch.toLowerCase();
    return students.filter(s => 
      `${s.lastName} ${s.firstName}`.toLowerCase().includes(search)
    );
  }, [students, studentSearch]);
    
  // Установить период "За весь период" - по первой и последней оценке
  const setFullPeriod = () => {
    if (grades.length > 0) {
      // Найти первую и последнюю оценку
      const sortedGrades = [...grades].sort((a, b) => a.date.localeCompare(b.date));
      const firstGradeDate = sortedGrades[0]?.date || getSchoolYearStart();
      const lastGradeDate = sortedGrades[sortedGrades.length - 1]?.date || getTodayString();
      
      setDateRange({
        start: firstGradeDate,
        end: lastGradeDate
      });
    } else {
      setDateRange({
        start: getSchoolYearStart(),
        end: getTodayString()
      });
    }
  };

  // Установить период "За неделю"
  const setWeekPeriod = () => {
    const today = getTodayDate();
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    setDateRange({
      start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
      end: getTodayString()
    });
  };

  // Установить период "За месяц"
  const setMonthPeriod = () => {
    const today = getTodayDate();
    const start = new Date(today);
    start.setMonth(start.getMonth() - 1);
    setDateRange({
      start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
      end: getTodayString()
    });
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Отчёты</h2>
      </div>

      {/* Выбор периода */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-4 shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Период:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={setWeekPeriod}
              className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              За неделю
            </button>
            <button
              onClick={setMonthPeriod}
              className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              За месяц
            </button>
            <button
              onClick={setFullPeriod}
              className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl transition-colors"
            >
              За весь период
            </button>
          </div>
          
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <Filter className="w-4 h-4" />
            {formatDateDisplay(dateRange.start)} — {formatDateDisplay(dateRange.end)}
            {showDatePicker ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Раскрывающаяся панель фильтра дат */}
        {showDatePicker && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-600 mb-1">Дата начала</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-600 mb-1">Дата окончания</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowDatePicker(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Применить
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Вкладки отчётов */}
      <div className="flex gap-2 border-b border-gray-200 pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Контент */}
      {activeTab === 'student' && (
        <StudentReport 
          students={students}
          grades={grades}
          dateRange={dateRange}
        />
      )}
      {activeTab === 'class' && (
        <ClassReport 
          students={students}
          grades={grades}
          dateRange={dateRange}
        />
      )}
      {activeTab === 'statistics' && (
        <StatisticsReport 
          students={students}
          grades={grades}
          dateRange={dateRange}
        />
      )}
      {activeTab === 'attendance' && (
        <AttendanceReport 
          students={students}
          attendance={attendance}
          dateRange={dateRange}
        />
      )}
    </div>
  );
};

// ==================== ТАБЕЛЬ УСПЕВАЕМОСТИ УЧЕНИКА ====================
interface StudentReportProps {
  students: any[];
  grades: any[];
  dateRange: DateRange;
}

const StudentReport: React.FC<StudentReportProps> = ({
  students,
  grades,
  dateRange
}) => {
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  // Сортируем учеников по фамилии
  const sortedStudents = [...students].sort((a, b) => 
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
  );

  // Получить оценки ученика за период с группировкой по предметам и датам
  const gradesBySubject = useMemo(() => {
    if (!selectedStudent) return {};
    const map: Record<string, { dates: Record<string, { value: number; excludeFromAverage?: boolean; reason?: string }[]> }> = {};
    SUBJECTS.forEach(s => { map[s] = { dates: {} }; });
    
    grades.filter(g => 
      g.studentId === selectedStudent && isDateInRange(g.date, dateRange)
    ).forEach(g => {
      if (!map[g.subject]) map[g.subject] = { dates: {} };
      if (!map[g.subject].dates[g.date]) map[g.subject].dates[g.date] = [];
      map[g.subject].dates[g.date].push({ value: g.value, excludeFromAverage: g.excludeFromAverage, reason: g.reason });
    });
    
    return map;
  }, [grades, selectedStudent, dateRange]);

  // Получить все даты за период с оценками
  const allDates = useMemo(() => {
    const dateSet = new Set<string>();
    grades.forEach(g => {
      if (g.studentId === selectedStudent && isDateInRange(g.date, dateRange)) {
        dateSet.add(g.date);
      }
    });
    return Array.from(dateSet).sort();
  }, [grades, selectedStudent, dateRange]);

  // Группировка дат по месяцам
  const monthGroups = useMemo(() => {
    const groups: { month: string; dates: string[] }[] = [];
    let currentMonth = '';
    allDates.forEach(d => {
      const m = MONTH_NAMES[parseInt(d.split('-')[1]) - 1]?.slice(0, 3) || '';
      if (m !== currentMonth) { currentMonth = m; groups.push({ month: m, dates: [d] }); }
      else { groups[groups.length - 1].dates.push(d); }
    });
    return groups;
  }, [allDates]);

  const selectedStudentData = students.find(s => s.id === selectedStudent);
  
  // Рассчитать средний балл по предмету
  const calculateAverage = (subject: string): string | null => {
    const data = gradesBySubject[subject];
    if (!data) return null;
    const validGrades: number[] = [];
    Object.values(data.dates).forEach(dayGrades => {
      dayGrades.forEach(g => {
        if (!g.excludeFromAverage) validGrades.push(g.value);
      });
    });
    if (validGrades.length === 0) return null;
    return (validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(2);
  };

  // Рассчитать общий средний балл
  const overallStudentAverage = useMemo(() => {
    let totalSum = 0;
    let count = 0;
    
    SUBJECTS.forEach(subject => {
      const avg = calculateAverage(subject);
      if (avg) {
        totalSum += parseFloat(avg);
        count++;
      }
    });
    
    return count > 0 ? (totalSum / count).toFixed(2) : null;
  }, [gradesBySubject]);

  // Функция цвета оценки
  const gradeColor = (v: number, excludeFromAverage?: boolean) => {
    if (excludeFromAverage) return 'bg-gray-200 text-gray-500';
    return v === 5 ? 'bg-green-100 text-green-700' : v === 4 ? 'bg-blue-100 text-blue-700' : v === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      {/* Выбор ученика через Select */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Выберите ученика</h3>
        
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          <option value="">-- Выберите ученика --</option>
          {sortedStudents.map(s => (
            <option key={s.id} value={s.id}>
              {s.lastName} {s.firstName}
            </option>
          ))}
        </select>
      </div>

      {/* Табель успеваемости - как в личном кабинете ученика */}
      {selectedStudent && selectedStudentData && (
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">
              Табель успеваемости
            </h3>
            <p className="text-gray-500 mt-1">
              {selectedStudentData.lastName} {selectedStudentData.firstName} · {formatDateDisplay(dateRange.start)} — {formatDateDisplay(dateRange.end)}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* Заголовок с месяцами */}
              <thead>
                {monthGroups.length > 0 && (
                  <tr className="bg-blue-50/50">
                    <th className="sticky left-0 z-10 bg-blue-50/50 px-4 py-3 text-left font-semibold text-blue-700 border-b border-r border-blue-200 min-w-[180px]"></th>
                    {monthGroups.map((mg, i) => (
                      <th key={i} colSpan={mg.dates.length} className="px-2 py-3 text-center font-bold text-blue-800 border-b border-r border-blue-200 text-xs uppercase">
                        {mg.month}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center font-semibold text-blue-700 border-b border-blue-200">Ср.</th>
                  </tr>
                )}
                {/* Заголовок с днями */}
                <tr className="bg-gray-50/50">
                  <th className="sticky left-0 z-10 bg-gray-50/50 px-4 py-3 text-left font-semibold text-gray-600 border-b border-r border-gray-300 min-w-[180px]">Предмет</th>
                  {allDates.map(d => (
                    <th key={d} className="px-2 py-3 text-center font-semibold text-gray-500 border-b border-r border-gray-200 min-w-[44px]">
                      {parseInt(d.split('-')[2])}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center font-semibold text-gray-500 border-b border-gray-300 min-w-[64px]">Ср.</th>
                </tr>
              </thead>
              <tbody>
                {SUBJECTS.map(subject => {
                  const data = gradesBySubject[subject];
                  if (!data || Object.keys(data.dates).length === 0) return null;
                  
                  const avg = calculateAverage(subject);
                  return (
                    <tr key={subject} className="border-b border-gray-200 hover:bg-white/50 transition-colors">
                      <td className="sticky left-0 z-10 bg-white px-4 py-2.5 font-bold text-gray-900 border-r border-gray-300">
                        {subject}
                      </td>
                      {allDates.map(d => {
                        const vals = data.dates[d] || [];
                        return (
                          <td key={d} className="px-1 py-2 text-center border-r border-gray-200">
                            <div className="flex flex-wrap gap-0.5 justify-center">
                              {vals.map((gradeObj, i) => (
                                <span
                                  key={i}
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${gradeColor(gradeObj.value, gradeObj.excludeFromAverage)}`}
                                  title={gradeObj.excludeFromAverage ? 'Не учитывается в среднем балле' : (gradeObj.reason || '')}
                                >
                                  {gradeObj.value}
                                </span>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-center border-gray-300">
                        {avg !== null ? (
                          <span className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-bold ${
                            parseFloat(avg) >= 4.5 ? 'bg-green-100 text-green-700' :
                            parseFloat(avg) >= 3.5 ? 'bg-blue-100 text-blue-700' :
                            parseFloat(avg) >= 2.5 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {avg}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Общий средний балл */}
              <tfoot className="bg-blue-50">
                <tr>
                  <td className="sticky left-0 z-10 bg-blue-50 px-4 py-3 font-bold text-blue-900 border-r border-blue-200">
                    Общий средний балл
                  </td>
                  {allDates.map(d => <td key={d} className="border-r border-blue-200"></td>)}
                  <td className="px-3 py-3 text-center">
                    {overallStudentAverage ? (
                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-bold ${
                        parseFloat(overallStudentAverage) >= 4.5 ? 'bg-green-200 text-green-800' :
                        parseFloat(overallStudentAverage) >= 3.5 ? 'bg-blue-200 text-blue-800' :
                        parseFloat(overallStudentAverage) >= 2.5 ? 'bg-yellow-200 text-yellow-800' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {overallStudentAverage}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== ОТЧЁТ УСПЕВАЕМОСТИ КЛАССА ====================
interface ClassReportProps {
  students: any[];
  grades: any[];
  dateRange: DateRange;
}

const ClassReport: React.FC<ClassReportProps> = ({ students, grades, dateRange }) => {
  // Рассчитать средний балл каждого ученика по каждому предмету (исключая серые оценки)
  const studentSubjectAverages = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};
    
    students.forEach(student => {
      result[student.id] = {};
      SUBJECTS.forEach(subject => {
        const subjectGrades = grades.filter(g => 
          g.studentId === student.id && 
          g.subject === subject && 
          isDateInRange(g.date, dateRange) &&
          !g.excludeFromAverage // Исключаем серые оценки
        );
        
        if (subjectGrades.length > 0) {
          const sum = subjectGrades.reduce((acc, g) => acc + g.value, 0);
          result[student.id][subject] = sum / subjectGrades.length;
        } else {
          result[student.id][subject] = -1; // Нет оценок
        }
      });
    });
    
    return result;
  }, [students, grades, dateRange]);

  // Рассчитать средний балл класса по каждому предмету (правильно: среднее всех оценок по предмету)
  const classSubjectAverages = useMemo(() => {
    const result: Record<string, number> = {};
    
    SUBJECTS.forEach(subject => {
      // Получаем все оценки по предмету за период (исключая серые оценки)
      const subjectAllGrades = grades.filter(g => 
        g.subject === subject && 
        isDateInRange(g.date, dateRange) &&
        !g.excludeFromAverage
      );
      
      if (subjectAllGrades.length > 0) {
        const sum = subjectAllGrades.reduce((acc, g) => acc + g.value, 0);
        result[subject] = sum / subjectAllGrades.length;
      } else {
        result[subject] = -1;
      }
    });
    
    return result;
  }, [grades, dateRange]);

  // Рассчитать общий процент успеваемости (правильно: по всем оценкам за период)
  const successRate = useMemo(() => {
    // Получаем все оценки за период (исключая серые оценки)
    const allGradesInRange = grades.filter(g => 
      isDateInRange(g.date, dateRange) && !g.excludeFromAverage
    );
    
    if (allGradesInRange.length === 0) return 0;
    
    const passingGrades = allGradesInRange.filter(g => g.value >= 3).length;
    return (passingGrades / allGradesInRange.length) * 100;
  }, [grades, dateRange]);

  // Рассчитать общий средний балл класса (по всем предметам)
  const overallClassAverage = useMemo(() => {
    // Получаем все оценки за период (исключая серые оценки)
    const allGradesInRange = grades.filter(g => 
      isDateInRange(g.date, dateRange) && !g.excludeFromAverage
    );
    
    if (allGradesInRange.length === 0) return -1;
    
    const sum = allGradesInRange.reduce((acc, g) => acc + g.value, 0);
    return sum / allGradesInRange.length;
  }, [grades, dateRange]);

  // Рассчитать общий средний балл каждого ученика по всем предметам
  const studentOverallAverages = useMemo(() => {
    const result: Record<string, number> = {};
    
    students.forEach(student => {
      // Получаем все оценки ученика за период (исключая серые оценки)
      const studentAllGrades = grades.filter(g => 
        g.studentId === student.id && 
        isDateInRange(g.date, dateRange) &&
        !g.excludeFromAverage
      );
      
      if (studentAllGrades.length > 0) {
        const sum = studentAllGrades.reduce((acc, g) => acc + g.value, 0);
        result[student.id] = sum / studentAllGrades.length;
      } else {
        result[student.id] = -1; // Нет оценок
      }
    });
    
    return result;
  }, [students, grades, dateRange]);

  // Отсортировать учеников по фамилии
  const sortedStudents = [...students].sort((a, b) => 
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
  );

  const formatAvg = (avg: number): string => {
    if (avg < 0) return '—';
    return avg.toFixed(2);
  };

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-xl font-bold text-gray-900">
          Сводная ведомость класса
        </h3>
        <p className="text-gray-500 mt-1">
          {formatDateDisplay(dateRange.start)} — {formatDateDisplay(dateRange.end)}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                Ученик
              </th>
              {SUBJECTS.map(subject => (
                <th key={subject} className="px-4 py-4 text-center text-sm font-semibold text-gray-700 min-w-[80px]">
                  {subject}
                </th>
              ))}
              <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700 min-w-[100px] bg-blue-50">
                Общий средний балл
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedStudents.map(student => (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 sticky left-0 bg-white z-10">
                  <span className="font-medium text-gray-900">
                    {student.lastName} {student.firstName}
                  </span>
                </td>
                {SUBJECTS.map(subject => {
                  const avg = studentSubjectAverages[student.id]?.[subject] ?? -1;
                  return (
                    <td key={subject} className="px-4 py-3 text-center">
                      {avg >= 0 ? (
                        <span className={`inline-flex px-2 py-1 rounded-lg text-sm font-semibold ${
                          avg >= 4.5 ? 'bg-green-100 text-green-700' :
                          avg >= 3.5 ? 'bg-blue-100 text-blue-700' :
                          avg >= 2.5 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {formatAvg(avg)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center bg-blue-50/50">
                  {(() => {
                    const overallAvg = studentOverallAverages[student.id] ?? -1;
                    if (overallAvg >= 0) {
                      return (
                        <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-bold ${
                          overallAvg >= 4.5 ? 'bg-green-200 text-green-800' :
                          overallAvg >= 3.5 ? 'bg-blue-200 text-blue-800' :
                          overallAvg >= 2.5 ? 'bg-yellow-200 text-yellow-800' :
                          'bg-red-200 text-red-800'
                        }`}>
                          {formatAvg(overallAvg)}
                        </span>
                      );
                    }
                    return <span className="text-gray-300">—</span>;
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Аналитика внизу */}
      <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Процент успеваемости</div>
              <div className="text-2xl font-bold text-gray-900">{successRate.toFixed(1)}%</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Средний балл класса</div>
              <div className="text-2xl font-bold text-gray-900">
                {overallClassAverage >= 0 ? formatAvg(overallClassAverage) : '—'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Учеников</div>
              <div className="text-2xl font-bold text-gray-900">{students.length}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Предметов</div>
              <div className="text-2xl font-bold text-gray-900">{SUBJECTS.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== ОТЧЁТ СТАТИСТИКА ====================
interface StatisticsReportProps {
  students: any[];
  grades: any[];
  dateRange: DateRange;
}

// Определение статуса ученика
function getStudentStatus(average: number): { label: string; className: string } {
  if (average >= 4.5) return { label: 'Отличник', className: 'bg-green-100 text-green-700 border-green-200' };
  if (average >= 3.5) return { label: 'Хорошист', className: 'bg-blue-100 text-blue-700 border-blue-200' };
  if (average >= 2.5) return { label: 'Троечник', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  return { label: 'Неуспевающий', className: 'bg-red-100 text-red-700 border-red-200' };
}

const StatisticsReport: React.FC<StatisticsReportProps> = ({
  students,
  grades,
  dateRange
}) => {
  // Рассчитать общий средний балл каждого ученика
  const studentOverallAverages = useMemo(() => {
    const result: Record<string, number> = {};
    
    students.forEach(student => {
      const studentAllGrades = grades.filter(g => 
        g.studentId === student.id && 
        isDateInRange(g.date, dateRange) &&
        !g.excludeFromAverage
      );
      
      if (studentAllGrades.length > 0) {
        const sum = studentAllGrades.reduce((acc, g) => acc + g.value, 0);
        result[student.id] = sum / studentAllGrades.length;
      } else {
        result[student.id] = -1;
      }
    });
    
    return result;
  }, [students, grades, dateRange]);

  // Рассчитать средний балл каждого ученика по каждому предмету
  const studentSubjectAverages = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};
    
    students.forEach(student => {
      result[student.id] = {};
      SUBJECTS.forEach(subject => {
        const subjectGrades = grades.filter(g => 
          g.studentId === student.id && 
          g.subject === subject && 
          isDateInRange(g.date, dateRange) &&
          !g.excludeFromAverage
        );
        
        if (subjectGrades.length > 0) {
          const sum = subjectGrades.reduce((acc, g) => acc + g.value, 0);
          result[student.id][subject] = sum / subjectGrades.length;
        } else {
          result[student.id][subject] = -1;
        }
      });
    });
    
    return result;
  }, [students, grades, dateRange]);

  // Рейтинг учеников по общему среднему баллу
  const overallRatings = useMemo(() => {
    const ratings = students
      .map(student => ({
        studentId: student.id,
        average: studentOverallAverages[student.id] ?? -1
      }))
      .filter(r => r.average >= 0)
      .sort((a, b) => b.average - a.average);
    
    return ratings;
  }, [students, studentOverallAverages]);

  // Рейтинг учеников по каждому предмету
  const subjectRatings = useMemo(() => {
    const result: Record<string, { studentId: string; average: number }[]> = {};
    
    SUBJECTS.forEach(subject => {
      result[subject] = students
        .map(student => ({
          studentId: student.id,
          average: studentSubjectAverages[student.id]?.[subject] ?? -1
        }))
        .filter(r => r.average >= 0)
        .sort((a, b) => b.average - a.average);
    });
    
    return result;
  }, [students, studentSubjectAverages]);

  // Получить место ученика в рейтинге
  const getRatingPosition = (studentId: string, ratings: { studentId: string; average: number }[]): number => {
    const position = ratings.findIndex(r => r.studentId === studentId);
    return position >= 0 ? position + 1 : -1;
  };

  // Отсортировать учеников по фамилии
  const sortedStudents = [...students].sort((a, b) => 
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
  );

  // Получить место ученика в общем рейтинге
  const getOverallPosition = (studentId: string): number => {
    return getRatingPosition(studentId, overallRatings);
  };

  return (
    <div className="space-y-6">
      {/* Таблица статистики всех учеников */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">
            Статистика класса
          </h3>
          <p className="text-gray-500 mt-1">
            {formatDateDisplay(dateRange.start)} — {formatDateDisplay(dateRange.end)}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                  Ученик
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Средний балл
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Место
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Статус
                </th>
                {SUBJECTS.slice(0, 5).map(subject => (
                  <th key={subject} className="px-3 py-3 text-center text-sm font-semibold text-gray-700 min-w-[70px]">
                    {subject.slice(0, 4)}
                  </th>
                ))}
                <th className="px-3 py-3 text-center text-sm font-semibold text-gray-700">...</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedStudents.map(student => {
                const overallAverage = studentOverallAverages[student.id] ?? -1;
                const overallPosition = getOverallPosition(student.id);
                const status = overallAverage >= 0 ? getStudentStatus(overallAverage) : null;
                
                return (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-white z-10">
                      <span className="font-medium text-gray-900">
                        {student.lastName} {student.firstName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {overallAverage >= 0 ? (
                        <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-bold ${
                          overallAverage >= 4.5 ? 'bg-green-100 text-green-700' :
                          overallAverage >= 3.5 ? 'bg-blue-100 text-blue-700' :
                          overallAverage >= 2.5 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {overallAverage.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {overallPosition > 0 ? (
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          overallPosition === 1 ? 'bg-yellow-100 text-yellow-700' :
                          overallPosition <= 3 ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {overallPosition}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {status ? (
                        <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold border ${status.className}`}>
                          {status.label}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    {SUBJECTS.slice(0, 5).map(subject => {
                      const avg = studentSubjectAverages[student.id]?.[subject] ?? -1;
                      const position = getRatingPosition(student.id, subjectRatings[subject]);
                      return (
                        <td key={subject} className="px-2 py-3 text-center">
                          {avg >= 0 ? (
                            <div className="flex flex-col items-center">
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                                avg >= 4.5 ? 'bg-green-100 text-green-700' :
                                avg >= 3.5 ? 'bg-blue-100 text-blue-700' :
                                avg >= 2.5 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {avg.toFixed(1)}
                              </span>
                              {position > 0 && position <= 3 && (
                                <span className="text-[10px] text-gray-500">#{position}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 py-3 text-center">
                      <span className="text-gray-400 text-xs">...</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Легенда статусов */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-gray-600 font-medium">Статусы:</span>
            <span className="inline-flex px-3 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700 border border-green-200">Отличник</span>
            <span className="inline-flex px-3 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">Хорошист</span>
            <span className="inline-flex px-3 py-1 rounded-lg text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">Троечник</span>
            <span className="inline-flex px-3 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-200">Неуспевающий</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== ОТЧЁТ О ПРОПУСКАХ ====================
interface AttendanceReportProps {
  students: any[];
  attendance: any[];
  dateRange: DateRange;
}

const AttendanceReport: React.FC<AttendanceReportProps> = ({ students, attendance, dateRange }) => {
  // Рассчитать пропуски для каждого ученика
  const studentAttendance = useMemo(() => {
    const result: Record<string, { Н: number; УП: number; Б: number; ОП: number; total: number }> = {};
    
    students.forEach(student => {
      result[student.id] = { Н: 0, УП: 0, Б: 0, ОП: 0, total: 0 };
    });
    
    attendance
      .filter(a => isDateInRange(a.date, dateRange))
      .forEach(record => {
        if (result[record.studentId]) {
          const type = record.type as 'Н' | 'УП' | 'Б' | 'ОП';
          if (type === 'Н' || type === 'УП' || type === 'Б' || type === 'ОП') {
            result[record.studentId][type]++;
            result[record.studentId].total++;
          }
        }
      });
    
    return result;
  }, [students, attendance, dateRange]);

  // Рассчитать итого по классу
  const totalAttendance = useMemo(() => {
    const totals = { Н: 0, УП: 0, Б: 0, ОП: 0, total: 0 };
    Object.values(studentAttendance).forEach(data => {
      totals.Н += data.Н;
      totals.УП += data.УП;
      totals.Б += data.Б;
      totals.ОП += data.ОП;
      totals.total += data.total;
    });
    return totals;
  }, [studentAttendance]);

  // Отсортировать учеников по фамилии
  const sortedStudents = [...students].sort((a, b) => 
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
  );

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-xl font-bold text-gray-900">
          Информация о пропусках
        </h3>
        <p className="text-gray-500 mt-1">
          {formatDateDisplay(dateRange.start)} — {formatDateDisplay(dateRange.end)}
        </p>
      </div>

      {/* Легенда */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-600">Типы отметок:</span>
          {ATTENDANCE_TYPES.map(type => (
            <div key={type.value} className="flex items-center gap-1.5">
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${type.bgColor} ${type.color}`}>
                {type.short}
              </span>
              <span className="text-gray-600">{type.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ученик</th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-100 text-red-700 text-xs font-bold">Н</span>
              </th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-700 text-xs font-bold">УП</span>
              </th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-100 text-amber-700 text-xs font-bold">Б</span>
              </th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-orange-100 text-orange-700 text-xs font-bold">ОП</span>
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Итого</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedStudents.map(student => {
              const data = studentAttendance[student.id] || { Н: 0, УП: 0, Б: 0, ОП: 0, total: 0 };
              return (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">
                      {student.lastName} {student.firstName}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {data.Н > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg text-sm font-bold bg-red-100 text-red-700">
                        {data.Н}
                      </span>
                    ) : (
                      <span className="text-gray-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {data.УП > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg text-sm font-bold bg-blue-100 text-blue-700">
                        {data.УП}
                      </span>
                    ) : (
                      <span className="text-gray-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {data.Б > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg text-sm font-bold bg-amber-100 text-amber-700">
                        {data.Б}
                      </span>
                    ) : (
                      <span className="text-gray-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {data.ОП > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg text-sm font-bold bg-orange-100 text-orange-700">
                        {data.ОП}
                      </span>
                    ) : (
                      <span className="text-gray-300">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {data.total > 0 ? (
                      <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-bold bg-gray-100 text-gray-700">
                        {data.total}
                      </span>
                    ) : (
                      <span className="text-gray-300">0</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-100">
            <tr>
              <td className="px-6 py-4 text-left text-sm font-bold text-gray-900">Итого по классу</td>
              <td className="px-4 py-4 text-center">
                {totalAttendance.Н > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg text-sm font-bold bg-red-100 text-red-700">
                    {totalAttendance.Н}
                  </span>
                ) : (
                  <span className="text-gray-400">0</span>
                )}
              </td>
              <td className="px-4 py-4 text-center">
                {totalAttendance.УП > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg text-sm font-bold bg-blue-100 text-blue-700">
                    {totalAttendance.УП}
                  </span>
                ) : (
                  <span className="text-gray-400">0</span>
                )}
              </td>
              <td className="px-4 py-4 text-center">
                {totalAttendance.Б > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg text-sm font-bold bg-amber-100 text-amber-700">
                    {totalAttendance.Б}
                  </span>
                ) : (
                  <span className="text-gray-400">0</span>
                )}
              </td>
              <td className="px-4 py-4 text-center">
                {totalAttendance.ОП > 0 ? (
                  <span className="inline-flex items-center justify-center min-width-[32px] px-2 py-1 rounded-lg text-sm font-bold bg-orange-100 text-orange-700">
                    {totalAttendance.ОП}
                  </span>
                ) : (
                  <span className="text-gray-400">0</span>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                {totalAttendance.total > 0 ? (
                  <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-bold bg-white text-gray-900 shadow-sm">
                    {totalAttendance.total}
                  </span>
                ) : (
                  <span className="text-gray-400">0</span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
