import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context';
import { SUBJECTS, MONTH_NAMES, MONTH_NAMES_GEN, getTodayString, getTodayDate, ATTENDANCE_TYPES } from '../data';
import {
  FileText, Calendar, Users, TrendingUp, ChevronDown, ChevronUp,
  Filter, User, BarChart3, AlertCircle, ChevronRight, ChevronLeft, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
import pdfFonts from 'pdfmake/build/vfs_fonts';
// @ts-ignore
pdfMake.vfs = pdfFonts.pdfMake.vfs;

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Журнал</h2>
        </div>
      </div>

      {/* Выбор периода - новый дизайн */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200/60 p-5 shadow-xl shadow-slate-200/50">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-violet-50 rounded-lg">
            <Calendar className="w-4 h-4 text-violet-600" />
            <span className="font-semibold text-violet-700 text-sm">Период</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={setWeekPeriod}
              className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all hover:scale-105 active:scale-95"
            >
              За неделю
            </button>
            <button
              onClick={setMonthPeriod}
              className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all hover:scale-105 active:scale-95"
            >
              За месяц
            </button>
            <button
              onClick={setFullPeriod}
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/30"
            >
              За весь период
            </button>
          </div>
          
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <Filter className="w-4 h-4" />
            <span className="truncate max-w-[200px]">{formatDateDisplay(dateRange.start)} — {formatDateDisplay(dateRange.end)}</span>
            {showDatePicker ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Раскрывающаяся панель фильтра дат */}
        {showDatePicker && (
          <div className="mt-5 p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 animate-fadeIn">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold text-slate-600 mb-2">Дата начала</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold text-slate-600 mb-2">Дата окончания</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all"
                />
              </div>
              <button
                onClick={() => setShowDatePicker(false)}
                className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all font-semibold shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95"
              >
                Применить
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Вкладки отчётов - новый дизайн */}
      <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-violet-700 shadow-lg shadow-slate-200/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
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
  const tableRef = useRef<HTMLDivElement>(null);

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

  // Функция цвета оценки - новые цвета
  const gradeColor = (v: number, excludeFromAverage?: boolean) => {
    if (excludeFromAverage) return 'bg-slate-200 text-slate-500';
    return v === 5 ? 'bg-emerald-100 text-emerald-700' : v === 4 ? 'bg-sky-100 text-sky-700' : v === 3 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';
  };

  // Функция экспорта в PDF
  const exportToPDF = async () => {
    console.log('Экспорт в PDF начат', { selectedStudentData: !!selectedStudentData });
    if (!selectedStudentData) {
      alert('Пожалуйста, выберите ученика');
      return;
    }
    
    try {
      // Создаём документ pdfMake
      const docDefinition: any = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [10, 20, 10, 20],
        content: [
          {
            text: 'Табель успеваемости',
            style: 'title',
            alignment: 'center'
          },
          {
            text: `${selectedStudentData.lastName} ${selectedStudentData.firstName}`,
            style: 'subtitle',
            alignment: 'center'
          },
          {
            text: `${formatDateDisplay(dateRange.start)} — ${formatDateDisplay(dateRange.end)}`,
            style: 'normal',
            alignment: 'center'
          }
        ],
        styles: {
          title: { fontSize: 18, bold: true, color: '#4c1d95' as any, margin: [0, 0, 0, 10] },
          subtitle: { fontSize: 14, color: '#334155' as any, margin: [0, 0, 0, 5] },
          normal: { fontSize: 10, color: '#334155' as any },
          tableHeader: { bold: true, fontSize: 10, color: '#4c1d95' as any, fillColor: '#eee2ff' },
          tableCell: { fontSize: 9, color: '#334155' as any },
        }
      };
      
      if (overallStudentAverage) {
        docDefinition.content.push({
          text: `Средний балл: ${overallStudentAverage}`,
          style: 'normal',
          alignment: 'center',
          margin: [0, 5, 0, 15]
        });
      } else {
        docDefinition.content.push({ text: '', margin: [0, 0, 0, 15] });
      }
      
      // Создаём таблицу
      const tableBody: any[] = [];
      
      // Заголовок таблицы
      const headerRow: any[] = [{ text: 'Предмет', style: 'tableHeader' }];
      allDates.slice(0, 15).forEach(d => {
        headerRow.push({ text: d.split('-')[2], style: 'tableHeader', alignment: 'center' });
      });
      headerRow.push({ text: 'Ср.', style: 'tableHeader', alignment: 'center' });
      tableBody.push(headerRow);
      
      // Строки с оценками
      let rowIndex = 0;
      SUBJECTS.forEach((subject) => {
        const data = gradesBySubject[subject];
        if (!data || Object.keys(data.dates).length === 0) return;
        
        const row: any[] = [];
        row.push({ text: subject, style: 'tableCell', bold: true });
        
        allDates.slice(0, 15).forEach(d => {
          const vals = data.dates[d] || [];
          if (vals.length > 0) {
            row.push({ text: vals.map(v => v.value.toString()).join(','), style: 'tableCell', alignment: 'center' });
          } else {
            row.push({ text: '', style: 'tableCell' });
          }
        });
        
        const avg = calculateAverage(subject);
        row.push({ text: avg || '-', style: 'tableCell', bold: !!avg, alignment: 'center' });
        
        tableBody.push(row);
        rowIndex++;
      });
      
      docDefinition.content.push({
        table: {
          headerRows: 1,
          widths: ['*', ...Array(15).fill(25), 40],
          body: tableBody
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#e2e8f0',
          vLineColor: () => '#e2e8f0',
          fillColor: (rowIndex: number) => rowIndex % 2 === 0 ? '#f8fafc' : '#ffffff'
        }
      });
      
      const fileName = `табель_${selectedStudentData.lastName}_${selectedStudentData.firstName}_${dateRange.start}_${dateRange.end}.pdf`;
      pdfMake.createPdf(docDefinition).download(fileName);
      console.log('PDF сохранён');
    } catch (error) {
      console.error('Ошибка при экспорте в PDF:', error);
      alert(`Ошибка при экспорте в PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Выбор ученика через Select - новый дизайн */}
      <div className="bg-gradient-to-br from-white to-violet-50/30 rounded-2xl border border-violet-200/50 p-6 shadow-xl shadow-violet-200/30">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-violet-600" />
          Выберите ученика
        </h3>
        
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 text-slate-800 font-medium transition-all"
        >
          <option value="">-- Выберите ученика --</option>
          {sortedStudents.map(s => (
            <option key={s.id} value={s.id}>
              {s.lastName} {s.firstName}
            </option>
          ))}
        </select>
      </div>

      {/* Табель успеваемости - как в личном кабинете ученика - новый дизайн */}
      {selectedStudent && selectedStudentData && (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50/50 to-purple-50/50 flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-violet-700 to-purple-700 bg-clip-text text-transparent">
                Табель успеваемости
              </h3>
              <p className="text-slate-500 mt-1 font-medium">
                <span className="text-violet-600">{selectedStudentData.lastName} {selectedStudentData.firstName}</span> · {formatDateDisplay(dateRange.start)} — {formatDateDisplay(dateRange.end)}
              </p>
            </div>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors shadow-md"
            >
              <Download className="w-4 h-4" />
              Скачать PDF
            </button>
          </div>

          <div className="overflow-x-auto" ref={tableRef}>
            <table className="w-full text-sm">
              {/* Заголовок с месяцами */}
              <thead>
                {monthGroups.length > 0 && (
                  <tr className="bg-gradient-to-r from-violet-100 to-purple-100">
                    <th className="sticky left-0 z-10 bg-gradient-to-r from-violet-100 to-purple-100 px-4 py-3 text-left font-bold text-violet-700 border-b border-r border-violet-200 min-w-[180px]"></th>
                    {monthGroups.map((mg, i) => (
                      <th key={i} colSpan={mg.dates.length} className="px-2 py-3 text-center font-bold text-violet-800 border-b border-r border-violet-200 text-xs uppercase">
                        {mg.month}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center font-bold text-violet-700 border-b border-violet-200">Ср.</th>
                  </tr>
                )}
                {/* Заголовок с днями */}
                <tr className="bg-slate-50">
                  <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left font-bold text-slate-600 border-b border-r border-slate-200 min-w-[180px]">Предмет</th>
                  {allDates.map(d => (
                    <th key={d} className="px-2 py-3 text-center font-semibold text-slate-500 border-b border-r border-slate-200 min-w-[44px]">
                      {parseInt(d.split('-')[2])}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center font-semibold text-slate-500 border-b border-slate-200 min-w-[64px]">Ср.</th>
                </tr>
              </thead>
              <tbody>
                {SUBJECTS.map(subject => {
                  const data = gradesBySubject[subject];
                  if (!data || Object.keys(data.dates).length === 0) return null;
                  
                  const avg = calculateAverage(subject);
                  return (
                    <tr key={subject} className="border-b border-slate-100 hover:bg-violet-50/50 transition-colors">
                      <td className="sticky left-0 z-10 bg-white px-4 py-2.5 font-bold text-slate-800 border-r border-slate-200">
                        {subject}
                      </td>
                      {allDates.map(d => {
                        const vals = data.dates[d] || [];
                        return (
                          <td key={d} className="px-1 py-2 text-center border-r border-slate-100">
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
                      <td className="px-2 py-2 text-center border-slate-200">
                        {avg !== null ? (
                          <span className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-bold ${
                            parseFloat(avg) >= 4.5 ? 'bg-emerald-100 text-emerald-700' :
                            parseFloat(avg) >= 3.5 ? 'bg-sky-100 text-sky-700' :
                            parseFloat(avg) >= 2.5 ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {avg}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Общий средний балл */}
              <tfoot className="bg-gradient-to-r from-violet-100 to-purple-100">
                <tr>
                  <td className="sticky left-0 z-10 bg-gradient-to-r from-violet-100 to-purple-100 px-4 py-3 font-bold text-violet-800 border-r border-violet-200">
                    Общий средний балл
                  </td>
                  {allDates.map(d => <td key={d} className="border-r border-violet-200"></td>)}
                  <td className="px-3 py-3 text-center">
                    {overallStudentAverage ? (
                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-bold ${
                        parseFloat(overallStudentAverage) >= 4.5 ? 'bg-emerald-200 text-emerald-800' :
                        parseFloat(overallStudentAverage) >= 3.5 ? 'bg-sky-200 text-sky-800' :
                        parseFloat(overallStudentAverage) >= 2.5 ? 'bg-amber-200 text-amber-800' :
                        'bg-rose-200 text-rose-800'
                      }`}>
                        {overallStudentAverage}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
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
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50/50 to-purple-50/50">
        <h3 className="text-xl font-bold bg-gradient-to-r from-violet-700 to-purple-700 bg-clip-text text-transparent">
          Сводная ведомость класса
        </h3>
        <p className="text-slate-500 mt-1 font-medium">
          {formatDateDisplay(dateRange.start)} — {formatDateDisplay(dateRange.end)}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-4 text-left text-sm font-bold text-slate-700 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                Ученик
              </th>
              {SUBJECTS.map(subject => (
                <th key={subject} className="px-4 py-4 text-center text-sm font-bold text-slate-700 min-w-[80px] border-r border-slate-200">
                  {subject}
                </th>
              ))}
              <th className="px-4 py-4 text-center text-sm font-bold text-violet-700 min-w-[100px] bg-violet-50 border-l-2 border-violet-300">
                Общий средний балл
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedStudents.map(student => (
              <tr key={student.id} className="hover:bg-violet-50/50 transition-colors">
                <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-slate-200">
                  <span className="font-semibold text-slate-800">
                    {student.lastName} {student.firstName}
                  </span>
                </td>
                {SUBJECTS.map(subject => {
                  const avg = studentSubjectAverages[student.id]?.[subject] ?? -1;
                  return (
                    <td key={subject} className="px-4 py-3 text-center border-r border-slate-200">
                      {avg >= 0 ? (
                        <span className={`inline-flex px-2 py-1 rounded-lg text-sm font-semibold ${
                          avg >= 4.5 ? 'bg-emerald-100 text-emerald-700' :
                          avg >= 3.5 ? 'bg-sky-100 text-sky-700' :
                          avg >= 2.5 ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {formatAvg(avg)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center bg-violet-50/50 border-l-2 border-violet-300">
                  {(() => {
                    const overallAvg = studentOverallAverages[student.id] ?? -1;
                    if (overallAvg >= 0) {
                      return (
                        <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-bold ${
                          overallAvg >= 4.5 ? 'bg-emerald-200 text-emerald-800' :
                          overallAvg >= 3.5 ? 'bg-sky-200 text-sky-800' :
                          overallAvg >= 2.5 ? 'bg-amber-200 text-amber-800' :
                          'bg-rose-200 text-rose-800'
                        }`}>
                          {formatAvg(overallAvg)}
                        </span>
                      );
                    }
                    return <span className="text-slate-300">—</span>;
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
          {/* Итоговая строка - средний балл по предметам */}
          <tfoot className="bg-gradient-to-r from-violet-100 to-purple-100 border-t-2 border-violet-200">
            <tr>
              <td className="px-4 py-3 sticky left-0 bg-gradient-to-r from-violet-100 to-purple-100 z-10 font-bold text-violet-800 border-r border-violet-200">
                Средний балл по предмету
              </td>
              {SUBJECTS.map(subject => {
                const avg = classSubjectAverages[subject] ?? -1;
                return (
                  <td key={subject} className="px-4 py-3 text-center border-r border-violet-200">
                    {avg >= 0 ? (
                      <span className={`inline-flex px-2 py-1 rounded-lg text-sm font-bold ${
                        avg >= 4.5 ? 'bg-emerald-200 text-emerald-800' :
                        avg >= 3.5 ? 'bg-sky-200 text-sky-800' :
                        avg >= 2.5 ? 'bg-amber-200 text-amber-800' :
                        'bg-rose-200 text-rose-800'
                      }`}>
                        {formatAvg(avg)}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-center bg-violet-200 border-l-2 border-violet-300">
                {overallClassAverage >= 0 ? (
                  <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-bold ${
                    overallClassAverage >= 4.5 ? 'bg-emerald-300 text-emerald-900' :
                    overallClassAverage >= 3.5 ? 'bg-sky-300 text-sky-900' :
                    overallClassAverage >= 2.5 ? 'bg-amber-300 text-amber-900' :
                    'bg-rose-300 text-rose-900'
                  }`}>
                    {formatAvg(overallClassAverage)}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Аналитика внизу - новый дизайн */}
      <div className="p-6 border-t border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm text-slate-500 font-medium">Процент успеваемости</div>
              <div className="text-2xl font-bold text-slate-800">{successRate.toFixed(1)}%</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-500/25">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm text-slate-500 font-medium">Средний балл класса</div>
              <div className="text-2xl font-bold text-slate-800">
                {overallClassAverage >= 0 ? formatAvg(overallClassAverage) : '—'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm text-slate-500 font-medium">Учеников</div>
              <div className="text-2xl font-bold text-slate-800">{students.length}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm text-slate-500 font-medium">Предметов</div>
              <div className="text-2xl font-bold text-slate-800">{SUBJECTS.length}</div>
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

// Определение статуса ученика по среднему баллу каждого предмета
// Отличник: все средние баллы >= 4.5 (все 5)
// Хорошист: все средние баллы >= 3.5 и < 4.5 (4 или 5 без троек)
// Троечник: средние баллы >= 2.5, но есть предметы < 3.5 (есть 3, но есть и 4 и 5)
// Неуспевающий: есть предметы со средним баллом < 2.5 (есть 2)
function getStudentStatus(subjectAverages: Record<string, number>): { label: string; className: string } {
  const averages = Object.values(subjectAverages).filter(a => a >= 0);
  
  if (averages.length === 0) return { label: '—', className: 'bg-slate-100 text-slate-500 border-slate-200' };
  
  const hasLow = averages.some(a => a < 2.5); // есть 2
  const has3 = averages.some(a => a >= 2.5 && a < 3.5); // есть 3
  const has4 = averages.some(a => a >= 3.5 && a < 4.5); // есть 4
  const has5 = averages.some(a => a >= 4.5); // есть 5
  const all5 = averages.every(a => a >= 4.5); // все 5
  const only45 = !has3 && !hasLow && (has4 || has5); // 4 или 5 без троек
  const has3And45 = has3 && (has4 || has5); // есть 3 и есть 4 или 5
  
  if (hasLow) return { label: 'Неуспевающий', className: 'bg-rose-100 text-rose-700 border-rose-200' };
  if (all5) return { label: 'Отличник', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  if (only45) return { label: 'Хорошист', className: 'bg-sky-100 text-sky-700 border-sky-200' };
  if (has3And45) return { label: 'Троечник', className: 'bg-amber-100 text-amber-700 border-amber-200' };
  if (has3 && !has4 && !has5) return { label: 'Троечник', className: 'bg-amber-100 text-amber-700 border-amber-200' };
  return { label: 'Неуспевающий', className: 'bg-rose-100 text-rose-700 border-rose-200' };
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
      {/* Таблица статистики всех учеников - новый дизайн */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50/50 to-purple-50/50">
          <h3 className="text-xl font-bold bg-gradient-to-r from-violet-700 to-purple-700 bg-clip-text text-transparent">
            Статистика класса
          </h3>
          <p className="text-slate-500 mt-1 font-medium">
            {formatDateDisplay(dateRange.start)} — {formatDateDisplay(dateRange.end)}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                  Ученик
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">
                  Средний балл
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200">
                  Место
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 border-l border-slate-200">
                  Статус
                </th>
                {SUBJECTS.map(subject => (
                  <th key={subject} className="px-3 py-3 text-center text-sm font-bold text-slate-700 min-w-[90px] border-l border-slate-200">
                    {subject}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedStudents.map(student => {
                const overallAverage = studentOverallAverages[student.id] ?? -1;
                const overallPosition = getOverallPosition(student.id);
                const status = getStudentStatus(studentSubjectAverages[student.id] || {});
                
                return (
                  <tr key={student.id} className="hover:bg-violet-50/50 transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-slate-200">
                      <span className="font-semibold text-slate-800">
                        {student.lastName} {student.firstName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center border-r border-slate-200">
                      {overallAverage >= 0 ? (
                        <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-bold ${
                          overallAverage >= 4.5 ? 'bg-emerald-100 text-emerald-700' :
                          overallAverage >= 3.5 ? 'bg-sky-100 text-sky-700' :
                          overallAverage >= 2.5 ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {overallAverage.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center border-r border-slate-200">
                      {overallPosition > 0 ? (
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          overallPosition === 1 ? 'bg-amber-200 text-amber-700' :
                          overallPosition <= 3 ? 'bg-sky-200 text-sky-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {overallPosition}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center border-l border-slate-200">
                      {status ? (
                        <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold border ${status.className}`}>
                          {status.label}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    {SUBJECTS.map(subject => {
                      const avg = studentSubjectAverages[student.id]?.[subject] ?? -1;
                      const position = getRatingPosition(student.id, subjectRatings[subject]);
                      return (
                        <td key={subject} className="px-2 py-3 text-center border-l border-slate-200">
                          {avg >= 0 ? (
                            <div className="flex flex-col items-center">
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                                avg >= 4.5 ? 'bg-emerald-100 text-emerald-700' :
                                avg >= 3.5 ? 'bg-sky-100 text-sky-700' :
                                avg >= 2.5 ? 'bg-amber-100 text-amber-700' :
                                'bg-rose-100 text-rose-700'
                              }`}>
                                {avg.toFixed(2)}
                              </span>
                              {position > 0 && position <= 3 && (
                                <span className="text-[10px] text-violet-500 font-medium">#{position}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Легенда статусов - новый дизайн */}
        <div className="p-4 border-t border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-slate-600 font-semibold">Статусы:</span>
            <span className="inline-flex px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">Отличник</span>
            <span className="inline-flex px-3 py-1 rounded-lg text-xs font-bold bg-sky-100 text-sky-700 border border-sky-200">Хорошист</span>
            <span className="inline-flex px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">Троечник</span>
            <span className="inline-flex px-3 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">Неуспевающий</span>
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
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50/50 to-purple-50/50">
        <h3 className="text-xl font-bold bg-gradient-to-r from-violet-700 to-purple-700 bg-clip-text text-transparent">
          Информация о пропусках
        </h3>
        <p className="text-slate-500 mt-1 font-medium">
          {formatDateDisplay(dateRange.start)} — {formatDateDisplay(dateRange.end)}
        </p>
      </div>

      {/* Легенда - новый дизайн */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-violet-50 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-slate-600 font-semibold">Типы отметок:</span>
          {ATTENDANCE_TYPES.map(type => (
            <div key={type.value} className="flex items-center gap-1.5">
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${type.bgColor} ${type.color}`}>
                {type.short}
              </span>
              <span className="text-slate-600">{type.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 border-r border-slate-200">Ученик</th>
              <th className="px-4 py-4 text-center text-sm font-bold text-slate-700 border-r border-slate-200">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold">Н</span>
              </th>
              <th className="px-4 py-4 text-center text-sm font-bold text-slate-700 border-r border-slate-200">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-sky-100 text-sky-700 text-xs font-bold">УП</span>
              </th>
              <th className="px-4 py-4 text-center text-sm font-bold text-slate-700 border-r border-slate-200">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">Б</span>
              </th>
              <th className="px-4 py-4 text-center text-sm font-bold text-slate-700 border-r border-slate-200">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-orange-100 text-orange-700 text-xs font-bold">ОП</span>
              </th>
              <th className="px-6 py-4 text-center text-sm font-bold text-violet-700 border-l-2 border-violet-300">Итого</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedStudents.map(student => {
              const data = studentAttendance[student.id] || { Н: 0, УП: 0, Б: 0, ОП: 0, total: 0 };
              return (
                <tr key={student.id} className="hover:bg-violet-50/50 transition-colors">
                  <td className="px-6 py-4 border-r border-slate-200">
                    <span className="font-semibold text-slate-800">
                      {student.lastName} {student.firstName}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center border-r border-slate-200">
                    {data.Н > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg text-sm font-bold bg-rose-100 text-rose-700">
                        {data.Н}
                      </span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center border-r border-slate-200">
                    {data.УП > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg text-sm font-bold bg-sky-100 text-sky-700">
                        {data.УП}
                      </span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center border-r border-slate-200">
                    {data.Б > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg text-sm font-bold bg-amber-100 text-amber-700">
                        {data.Б}
                      </span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center border-r border-slate-200">
                    {data.ОП > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg text-sm font-bold bg-orange-100 text-orange-700">
                        {data.ОП}
                      </span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center border-l-2 border-violet-300">
                    {data.total > 0 ? (
                      <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-bold bg-violet-100 text-violet-700">
                        {data.total}
                      </span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gradient-to-r from-violet-100 to-purple-100 border-t-2 border-violet-200">
            <tr>
              <td className="px-6 py-4 text-left text-sm font-bold text-violet-800 border-r border-violet-200">Итого по классу</td>
              <td className="px-4 py-4 text-center border-r border-violet-200">
                {totalAttendance.Н > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg text-sm font-bold bg-rose-100 text-rose-700">
                    {totalAttendance.Н}
                  </span>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </td>
              <td className="px-4 py-4 text-center border-r border-violet-200">
                {totalAttendance.УП > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg text-sm font-bold bg-sky-100 text-sky-700">
                    {totalAttendance.УП}
                  </span>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </td>
              <td className="px-4 py-4 text-center border-r border-violet-200">
                {totalAttendance.Б > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg text-sm font-bold bg-amber-100 text-amber-700">
                    {totalAttendance.Б}
                  </span>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </td>
              <td className="px-4 py-4 text-center border-r border-violet-200">
                {totalAttendance.ОП > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg text-sm font-bold bg-orange-100 text-orange-700">
                    {totalAttendance.ОП}
                  </span>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </td>
              <td className="px-6 py-4 text-center border-l-2 border-violet-300">
                {totalAttendance.total > 0 ? (
                  <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-bold bg-white text-violet-800 shadow-sm">
                    {totalAttendance.total}
                  </span>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
