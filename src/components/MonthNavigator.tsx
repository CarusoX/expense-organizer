'use client';

import { MONTH_NAMES } from '../lib/types';

interface MonthNavigatorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export default function MonthNavigator({ month, year, onChange }: MonthNavigatorProps) {
  const goToPrev = () => {
    if (month === 1) {
      onChange(12, year - 1);
    } else {
      onChange(month - 1, year);
    }
  };

  const goToNext = () => {
    if (month === 12) {
      onChange(1, year + 1);
    } else {
      onChange(month + 1, year);
    }
  };

  const goToToday = () => {
    const now = new Date();
    onChange(now.getMonth() + 1, now.getFullYear());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return month === now.getMonth() + 1 && year === now.getFullYear();
  };

  return (
    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
      <button
        onClick={goToPrev}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
        title="Previous month"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        {!isCurrentMonth() && (
          <button
            onClick={goToToday}
            className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            Today
          </button>
        )}
      </div>

      <button
        onClick={goToNext}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
        title="Next month"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
