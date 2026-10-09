import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface CalendarViewProps {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  taskDates: Set<string>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onSelectDate,
  taskDates,
}) => {
  const { colors, isDarkMode } = useTheme();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  const renderDays = () => {
    const grid: React.ReactNode[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      grid.push(<div key={`empty-${i}`} className="w-[14.28%] h-10 my-0.5" />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const monthFormatted = String(currentMonth + 1).padStart(2, '0');
      const dayFormatted = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${monthFormatted}-${dayFormatted}`;

      const isSelected = selectedDate === dateStr;
      const isToday = now.getDate() === day;
      const hasTask = taskDates.has(dateStr);

      grid.push(
        <button
          key={dateStr}
          type="button"
          className={`w-[14.28%] h-10 flex flex-col justify-center items-center rounded-xl my-0.5 transition-all text-sm ${
            isSelected
              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30 scale-105'
              : isToday
              ? isDarkMode
                ? 'bg-slate-800 border border-blue-500 text-blue-400 font-bold'
                : 'bg-slate-100 border border-blue-500 text-blue-600 font-bold'
              : isDarkMode
              ? 'hover:bg-slate-800 text-slate-100 font-medium'
              : 'hover:bg-slate-100 text-slate-800 font-medium'
          }`}
          onClick={() => onSelectDate(dateStr)}
        >
          <span>{day}</span>
          {hasTask ? (
            <span
              className={`w-1.5 h-1.5 rounded-full mt-0.5 transition-colors ${
                isSelected ? 'bg-white' : 'bg-red-500'
              }`}
            />
          ) : null}
        </button>
      );
    }

    return grid;
  };

  return (
    <div
      className="rounded-2xl p-4 mb-4 border shadow-sm transition-colors"
      style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
    >
      <div className="text-center mb-3">
        <h2 className="text-base font-bold" style={{ color: colors.textPrimary }}>
          🗓️ {monthNames[currentMonth]} {currentYear}
        </h2>
      </div>

      <div
        className="flex justify-around mb-2 border-b pb-1.5"
        style={{ borderBottomColor: colors.borderColor }}
      >
        {dayNames.map((name) => (
          <span
            key={name}
            className="w-[14.28%] text-center text-xs font-semibold"
            style={{ color: colors.textSecondary }}
          >
            {name}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap">{renderDays()}</div>
    </div>
  );
};
