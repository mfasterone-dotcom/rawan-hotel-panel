'use client';

import { useMemo, useState } from 'react';
import type { Room } from '@/lib/types/room';

export interface SelectedDateRange {
  start: Date;
  end: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor: string;
  borderColor: string;
  display: 'background' | 'block';
  extendedProps: {
    type: 'excluded' | 'priceIncrease' | 'priceDecrease';
    value?: number;
  };
}

export function useRoomCalendar(room: Room | null) {
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [selectedRange, setSelectedRange] = useState<SelectedDateRange | null>(null);

  // Get current year for date range calculation
  const currentYear = new Date().getFullYear();
  const minDate = new Date(currentYear - 2, 0, 1);
  const maxDate = new Date(currentYear + 2, 11, 31);

  // Convert date to YYYY-MM-DD string
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Parse YYYY-MM-DD string to Date
  const parseDateString = (dateString: string): Date => {
    return new Date(dateString + 'T00:00:00');
  };

  // Get all dates in a range
  const getDatesInRange = (start: Date, end: Date): string[] => {
    const dates: string[] = [];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      dates.push(formatDateString(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  // Handle date selection from calendar
  const handleDateSelect = (start: Date, end: Date) => {
    const dates = getDatesInRange(start, end);
    setSelectedDates(new Set(dates));
    setSelectedRange({ start, end });
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedDates(new Set());
    setSelectedRange(null);
  };

  // Convert room date ranges to calendar events
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    if (!room) return [];

    const events: CalendarEvent[] = [];

    // Excluded date ranges (red)
    if (room.excludedDateRanges) {
      room.excludedDateRanges.forEach(range => {
        const start = parseDateString(range.StartDate);
        const end = parseDateString(range.EndDate);
        // Add one day to end date to make it inclusive
        end.setDate(end.getDate() + 1);

        events.push({
          id: `excluded-${range.id}`,
          title: 'Unavailable',
          start,
          end,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgba(239, 68, 68, 0.5)',
          display: 'background',
          extendedProps: {
            type: 'excluded',
          },
        });
      });
    }

    // Price increase ranges (yellow/orange)
    if (room.priceIncreaseRanges) {
      room.priceIncreaseRanges.forEach(range => {
        const start = parseDateString(range.StartDate);
        const end = parseDateString(range.EndDate);
        end.setDate(end.getDate() + 1);

        events.push({
          id: `increase-${range.id}`,
          title: `Price +${range.IncreaseValue}%`,
          start,
          end,
          backgroundColor: 'rgba(251, 191, 36, 0.2)',
          borderColor: 'rgba(251, 191, 36, 0.5)',
          display: 'background',
          extendedProps: {
            type: 'priceIncrease',
            value: range.IncreaseValue,
          },
        });
      });
    }

    // Price decrease ranges (green)
    if (room.priceDecreaseRanges) {
      room.priceDecreaseRanges.forEach(range => {
        const start = parseDateString(range.StartDate);
        const end = parseDateString(range.EndDate);
        end.setDate(end.getDate() + 1);

        events.push({
          id: `decrease-${range.id}`,
          title: `Price -${range.DecreaseValue}%`,
          start,
          end,
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgba(34, 197, 94, 0.5)',
          display: 'background',
          extendedProps: {
            type: 'priceDecrease',
            value: range.DecreaseValue,
          },
        });
      });
    }

    return events;
  }, [room]);

  // Convert selected dates to date ranges for API
  const getSelectedDateRanges = (): Array<{ StartDate: string; EndDate: string }> => {
    if (selectedDates.size === 0) return [];

    const sortedDates = Array.from(selectedDates).sort();
    const ranges: Array<{ StartDate: string; EndDate: string }> = [];

    let rangeStart = sortedDates[0];
    let rangeEnd = sortedDates[0];

    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = parseDateString(sortedDates[i]);
      const prevDate = parseDateString(sortedDates[i - 1]);
      const daysDiff = Math.floor(
        (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        // Consecutive date, extend range
        rangeEnd = sortedDates[i];
      } else {
        // Gap found, save current range and start new one
        ranges.push({
          StartDate: rangeStart,
          EndDate: rangeEnd,
        });
        rangeStart = sortedDates[i];
        rangeEnd = sortedDates[i];
      }
    }

    // Add the last range
    ranges.push({
      StartDate: rangeStart,
      EndDate: rangeEnd,
    });

    return ranges;
  };

  return {
    selectedDates,
    selectedRange,
    calendarEvents,
    minDate,
    maxDate,
    handleDateSelect,
    clearSelection,
    getSelectedDateRanges,
    formatDateString,
    parseDateString,
  };
}
