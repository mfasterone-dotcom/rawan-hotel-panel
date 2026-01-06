'use client';

import { useState } from 'react';
import { useBookings } from '@/hooks/use-bookings';
import { useRoom } from '@/hooks/use-rooms';
import { CalendarSidePanel } from './calendar-side-panel';
import { MonthYearPicker } from './month-year-picker';
import { RoomSelector } from './room-selector';
import { AvailabilityDialog } from './availability-dialog';
import { DeletePriceRangeDialog } from './delete-price-range-dialog';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import type { PriceIncreaseRange, PriceDecreaseRange, ExcludedDateRange } from '@/lib/types/room';

// Type that handles both camelCase (API response) and PascalCase (type definition)
type PriceRangeWithVariants = {
  startDate?: string;
  StartDate?: string;
  endDate?: string;
  EndDate?: string;
  id?: number;
  increaseValue?: number;
  IncreaseValue?: number;
  decreaseValue?: number;
  DecreaseValue?: number;
};

// Type that handles both camelCase (API response) and PascalCase (type definition) for excluded ranges
type ExcludedRangeWithVariants = {
  startDate?: string;
  StartDate?: string;
  endDate?: string;
  EndDate?: string;
  id?: number;
};

interface RangeInfo {
  startDate: string;
  endDate: string;
  value: number;
}

// Helper functions to replace date-fns
const startOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const eachDayOfInterval = ({ start, end }: { start: Date; end: Date }) => {
  const days: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

const isSameMonth = (date1: Date, date2: Date) => {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
};

const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const format = (date: Date, formatStr: string) => {
  if (formatStr === 'd') {
    return date.getDate().toString();
  }
  if (formatStr === 'EEEE, MMMM d, yyyy') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
  return date.toLocaleDateString();
};

const parseISO = (dateString: string) => {
  return new Date(dateString);
};

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [deleteRangeDialogOpen, setDeleteRangeDialogOpen] = useState(false);
  const [selectedRangeToDelete, setSelectedRangeToDelete] = useState<{
    type: 'increase' | 'decrease';
    rangeId: number;
    rangeInfo: {
      startDate: string;
      endDate: string;
      value: number;
    };
  } | null>(null);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings();
  const { data: selectedRoom } = useRoom(selectedRoomId);
  const t = useTranslations('calendar');

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate padding for days before the first day of the month
  const firstDayOfWeek = monthStart.getDay(); // 0 = Sunday, 6 = Saturday
  const paddingDays: (Date | null)[] = Array(firstDayOfWeek).fill(null);

  // Combine padding and actual days
  const calendarDays = [...paddingDays, ...daysInMonth];

  // Filter bookings by selected room (propId) and date range
  const filteredBookings = bookings.filter(booking => {
    if (selectedRoomId && booking.propId !== selectedRoomId) return false;
    const checkIn = parseISO(booking.checkIn);
    const checkOut = parseISO(booking.checkOut);
    return (
      (isSameMonth(checkIn, selectedDate) || isSameMonth(checkOut, selectedDate)) ||
      (checkIn <= monthEnd && checkOut >= monthStart)
    );
  });

  // Get bookings for a specific day
  const getBookingsForDay = (day: Date) => {
    return filteredBookings.filter(booking => {
      const checkIn = parseISO(booking.checkIn);
      const checkOut = parseISO(booking.checkOut);
      return day >= checkIn && day <= checkOut;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Booked':
      case 'Check_in':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Check if a day is in the selected range
  const isInRange = (day: Date) => {
    if (!rangeStart || !rangeEnd) return false;
    const dayTime = day.getTime();
    const startTime = rangeStart.getTime();
    const endTime = rangeEnd.getTime();
    const minTime = Math.min(startTime, endTime);
    const maxTime = Math.max(startTime, endTime);
    return dayTime >= minTime && dayTime <= maxTime;
  };

  // Check if a day is the range start or end
  const isRangeStart = (day: Date) => {
    if (!rangeStart) return false;
    return isSameDay(day, rangeStart);
  };

  const isRangeEnd = (day: Date) => {
    if (!rangeEnd) return false;
    return isSameDay(day, rangeEnd);
  };

  // Handle day click - only for double-click or Ctrl+Click to open availability dialog
  // Right-click or Shift+Click on price adjustments to delete them
  const handleDayClick = (day: Date, event: React.MouseEvent) => {
    // Check if clicking on a price increase/decrease range (right-click or Shift+Click)
    const priceIncrease = isInPriceIncreaseRange(day);
    const priceDecrease = isInPriceDecreaseRange(day);
    
    if ((event.button === 2 || event.shiftKey) && (priceIncrease.inRange || priceDecrease.inRange)) {
      event.preventDefault();
      if (priceIncrease.inRange && priceIncrease.rangeId && priceIncrease.rangeInfo) {
        setSelectedRangeToDelete({
          type: 'increase',
          rangeId: priceIncrease.rangeId,
          rangeInfo: priceIncrease.rangeInfo,
        });
        setDeleteRangeDialogOpen(true);
        return;
      }
      if (priceDecrease.inRange && priceDecrease.rangeId && priceDecrease.rangeInfo) {
        setSelectedRangeToDelete({
          type: 'decrease',
          rangeId: priceDecrease.rangeId,
          rangeInfo: priceDecrease.rangeInfo,
        });
        setDeleteRangeDialogOpen(true);
        return;
      }
    }

    // Only allow double click or Ctrl+Click to open availability dialog
    if (event.detail === 2 || event.ctrlKey || event.metaKey) {
      setRangeStart(day);
      setRangeEnd(day);
      setAvailabilityDialogOpen(true);
      return;
    }
    // Single click just updates the selected date for viewing (no range selection)
    setSelectedDate(day);
  };

  // Clear range selection
  const clearRange = () => {
    setRangeStart(null);
    setRangeEnd(null);
    setIsSelectingRange(false);
  };

  // Format date to YYYY-MM-DD string for consistent comparison
  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check if a day is selected via checkbox
  const isDaySelected = (day: Date): boolean => {
    return selectedDays.has(formatDateKey(day));
  };

  // Handle checkbox toggle for day selection
  const handleDayCheckboxToggle = (day: Date, checked: boolean) => {
    // Don't allow selection if no room is selected
    if (!selectedRoomId) {
      return;
    }
    const dateKey = formatDateKey(day);
    const newSelectedDays = new Set(selectedDays);
    
    if (checked) {
      newSelectedDays.add(dateKey);
      
      // If there are other selected days, auto-select all days in between
      if (newSelectedDays.size > 1) {
        const sortedDates = Array.from(newSelectedDays).sort();
        const minDate = new Date(sortedDates[0] + 'T00:00:00');
        const maxDate = new Date(sortedDates[sortedDates.length - 1] + 'T00:00:00');
        
        // Add all days between min and max
        const current = new Date(minDate);
        while (current <= maxDate) {
          const currentKey = formatDateKey(current);
          newSelectedDays.add(currentKey);
          current.setDate(current.getDate() + 1);
        }
      }
    } else {
      // When unchecking, only remove that specific day
      newSelectedDays.delete(dateKey);
    }
    
    setSelectedDays(newSelectedDays);
  };

  // Clear all selected days
  const clearSelectedDays = () => {
    setSelectedDays(new Set());
  };

  // Check if a day is in a price increase range
  const isInPriceIncreaseRange = (day: Date): { inRange: boolean; value?: number; rangeId?: number; rangeInfo?: RangeInfo } => {
    if (!selectedRoom?.priceIncreaseRanges) return { inRange: false };
    for (const range of selectedRoom.priceIncreaseRanges) {
      // Handle both camelCase (API response) and PascalCase (type definition)
      const rangeWithVariants = range as PriceRangeWithVariants;
      const startDate = rangeWithVariants.startDate || rangeWithVariants.StartDate;
      const endDate = rangeWithVariants.endDate || rangeWithVariants.EndDate;
      const increaseValue = rangeWithVariants.increaseValue || rangeWithVariants.IncreaseValue;
      const rangeId = rangeWithVariants.id;
      
      // Skip if required values are missing
      if (!startDate || !endDate || increaseValue === undefined) {
        continue;
      }
      
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      if (day >= start && day <= end) {
        return {
          inRange: true,
          value: increaseValue,
          rangeId: rangeId,
          rangeInfo: {
            startDate,
            endDate,
            value: increaseValue,
          },
        };
      }
    }
    return { inRange: false };
  };

  // Check if a day is in a price decrease range
  const isInPriceDecreaseRange = (day: Date): { inRange: boolean; value?: number; rangeId?: number; rangeInfo?: RangeInfo } => {
    if (!selectedRoom?.priceDecreaseRanges) return { inRange: false };
    for (const range of selectedRoom.priceDecreaseRanges) {
      // Handle both camelCase (API response) and PascalCase (type definition)
      const rangeWithVariants = range as PriceRangeWithVariants;
      const startDate = rangeWithVariants.startDate || rangeWithVariants.StartDate;
      const endDate = rangeWithVariants.endDate || rangeWithVariants.EndDate;
      const decreaseValue = rangeWithVariants.decreaseValue || rangeWithVariants.DecreaseValue;
      const rangeId = rangeWithVariants.id;
      
      // Skip if required values are missing
      if (!startDate || !endDate || decreaseValue === undefined) {
        continue;
      }
      
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      if (day >= start && day <= end) {
        return {
          inRange: true,
          value: decreaseValue,
          rangeId: rangeId,
          rangeInfo: {
            startDate,
            endDate,
            value: decreaseValue,
          },
        };
      }
    }
    return { inRange: false };
  };

  // Check if a day is excluded
  const isExcluded = (day: Date): boolean => {
    if (!selectedRoom?.excludedDateRanges) return false;
    for (const range of selectedRoom.excludedDateRanges) {
      // Handle both camelCase (API response) and PascalCase (type definition)
      const rangeWithVariants = range as ExcludedRangeWithVariants;
      const startDate = rangeWithVariants.startDate || rangeWithVariants.StartDate;
      const endDate = rangeWithVariants.endDate || rangeWithVariants.EndDate;
      
      // Skip if required values are missing
      if (!startDate || !endDate) {
        continue;
      }
      
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      if (day >= start && day <= end) {
        return true;
      }
    }
    return false;
  };

  if (bookingsLoading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-muted-foreground'>{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className='flex gap-6'>
      <div className='flex-1'>
        <div className='flex items-center justify-between mb-6'>
          <MonthYearPicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
          <RoomSelector
            rooms={[]}
            selectedRoomId={selectedRoomId}
            onRoomChange={(roomId) => {
              setSelectedRoomId(roomId);
              // Clear selected days when room is deselected
              if (!roomId) {
                setSelectedDays(new Set());
              }
            }}
          />
        </div>

        <div className='rounded-lg border bg-card'>
          <div className='p-4 border-b flex items-center justify-between'>
            <div className='text-sm text-muted-foreground'>
              {selectedDays.size > 0
                ? `${selectedDays.size} ${t('daysSelected') || 'day'}${selectedDays.size !== 1 ? 's' : ''} selected`
                : selectedRoomId
                  ? 'Select days using checkboxes'
                  : 'Please select a room to manage dates'}
            </div>
            <div className='flex items-center gap-2'>
              {selectedDays.size > 0 && (
                <button
                  onClick={clearSelectedDays}
                  className='text-xs text-muted-foreground hover:text-foreground'
                >
                  {t('clearSelectedDays') || 'Clear selected days'}
                </button>
              )}
            </div>
          </div>
          <div className='grid grid-cols-7 gap-px border-b bg-border'>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className='bg-muted p-2 text-center text-sm font-medium'>
                {day}
              </div>
            ))}
          </div>
          <div className='grid grid-cols-7 gap-px bg-border'>
            {calendarDays.map((day, index) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className='min-h-24 bg-muted/30'
                  />
                );
              }

              const dayBookings = getBookingsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, selectedDate);
              const isSelected = isSameDay(day, selectedDate);
              const isDayChecked = isDaySelected(day);
              const priceIncrease = isInPriceIncreaseRange(day);
              const priceDecrease = isInPriceDecreaseRange(day);
              const excluded = isExcluded(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={e => handleDayClick(day, e)}
                  className={`min-h-24 bg-background p-2 transition-colors hover:bg-accent/50 relative ${
                    !isCurrentMonth ? 'opacity-50' : ''
                  } ${isToday ? 'ring-2 ring-primary' : ''} ${
                    isSelected ? 'bg-primary/10 ring-2 ring-primary' : ''
                  } ${isDayChecked ? 'bg-blue-50 dark:bg-blue-950/20' : ''} ${
                    excluded ? 'bg-red-100 dark:bg-red-950/30 border-2 border-red-400' : ''
                  } ${
                    priceIncrease.inRange ? 'bg-orange-50 dark:bg-orange-950/20 border-l-4 border-orange-500' : ''
                  } ${
                    priceDecrease.inRange ? 'bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500' : ''
                  }`}
                  title={
                    excluded
                      ? 'Unavailable (Excluded)'
                      : priceIncrease.inRange
                        ? `Price +${priceIncrease.value}% - Right-click or Shift+Click to delete`
                        : priceDecrease.inRange
                          ? `Price -${priceDecrease.value}% - Right-click or Shift+Click to delete`
                          : t('doubleClickToManage')
                  }
                >
                  <div className='flex items-center justify-between mb-1'>
                    <div className='text-sm font-medium'>
                      {format(day, 'd')}
                    </div>
                    <Checkbox
                      checked={isDayChecked}
                      disabled={!selectedRoomId}
                      onCheckedChange={(checked) => {
                        handleDayCheckboxToggle(day, checked as boolean);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      className='h-4 w-4 cursor-pointer'
                      title={!selectedRoomId ? 'Please select a room first' : 'Click to select this day'}
                    />
                  </div>
                  <div className='space-y-1'>
                    {excluded && (
                      <div className='text-xs p-1 rounded bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200 font-medium'>
                        Unavailable
                      </div>
                    )}
                    {priceIncrease.inRange && !excluded && (
                      <div
                        className='text-xs p-1 rounded bg-orange-200 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 font-medium cursor-pointer hover:bg-orange-300 dark:hover:bg-orange-900/70 transition-colors'
                        title='Right-click or Shift+Click to delete this price increase'
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (priceIncrease.rangeId && priceIncrease.rangeInfo) {
                            setSelectedRangeToDelete({
                              type: 'increase',
                              rangeId: priceIncrease.rangeId,
                              rangeInfo: priceIncrease.rangeInfo,
                            });
                            setDeleteRangeDialogOpen(true);
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (e.shiftKey && priceIncrease.rangeId && priceIncrease.rangeInfo) {
                            setSelectedRangeToDelete({
                              type: 'increase',
                              rangeId: priceIncrease.rangeId,
                              rangeInfo: priceIncrease.rangeInfo,
                            });
                            setDeleteRangeDialogOpen(true);
                          }
                        }}
                      >
                        +{priceIncrease.value}%
                      </div>
                    )}
                    {priceDecrease.inRange && !excluded && (
                      <div
                        className='text-xs p-1 rounded bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200 font-medium cursor-pointer hover:bg-green-300 dark:hover:bg-green-900/70 transition-colors'
                        title='Right-click or Shift+Click to delete this price decrease'
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (priceDecrease.rangeId && priceDecrease.rangeInfo) {
                            setSelectedRangeToDelete({
                              type: 'decrease',
                              rangeId: priceDecrease.rangeId,
                              rangeInfo: priceDecrease.rangeInfo,
                            });
                            setDeleteRangeDialogOpen(true);
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (e.shiftKey && priceDecrease.rangeId && priceDecrease.rangeInfo) {
                            setSelectedRangeToDelete({
                              type: 'decrease',
                              rangeId: priceDecrease.rangeId,
                              rangeInfo: priceDecrease.rangeInfo,
                            });
                            setDeleteRangeDialogOpen(true);
                          }
                        }}
                      >
                        -{priceDecrease.value}%
                      </div>
                    )}
                    {dayBookings.slice(0, excluded ? 1 : 2).map(booking => (
                      <div
                        key={booking.id}
                        className={`text-xs p-1 rounded border truncate ${getStatusColor(
                          booking.bookStatus
                        )}`}
                        title={`${booking.propTitle} - ${booking.bookStatus}`}
                      >
                        {booking.propTitle}
                      </div>
                    ))}
                    {dayBookings.length > (excluded ? 1 : 2) && (
                      <div className='text-xs text-muted-foreground'>
                        +{dayBookings.length - (excluded ? 1 : 2)} {t('more')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <CalendarSidePanel
        selectedDate={selectedDate}
        bookings={filteredBookings}
        onDateSelect={setSelectedDate}
        selectedDays={selectedDays}
        selectedRoomId={selectedRoomId}
        selectedRoom={selectedRoom}
        onClearSelectedDays={clearSelectedDays}
      />

      <AvailabilityDialog
        open={availabilityDialogOpen}
        onOpenChange={setAvailabilityDialogOpen}
        roomId={selectedRoomId}
        startDate={rangeStart || selectedDate}
        endDate={rangeEnd || selectedDate}
      />

      <DeletePriceRangeDialog
        open={deleteRangeDialogOpen}
        onOpenChange={setDeleteRangeDialogOpen}
        type={selectedRangeToDelete?.type || 'increase'}
        rangeId={selectedRangeToDelete?.rangeId || null}
        rangeInfo={selectedRangeToDelete?.rangeInfo}
        onSuccess={() => {
          setSelectedRangeToDelete(null);
        }}
      />
    </div>
  );
}

