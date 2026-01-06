'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MonthYearPickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function MonthYearPicker({ selectedDate, onDateChange }: MonthYearPickerProps) {
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(currentMonth - 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(currentMonth + 1);
    onDateChange(newDate);
  };

  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(parseInt(monthIndex));
    onDateChange(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(parseInt(year));
    onDateChange(newDate);
  };

  return (
    <div className='flex items-center gap-2'>
      <Button
        variant='outline'
        size='icon'
        onClick={handlePreviousMonth}
        className='h-9 w-9'
      >
        <ChevronLeft className='h-4 w-4' />
      </Button>

      <div className='flex items-center gap-2'>
        <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
          <SelectTrigger className='w-[140px]'>
            <SelectValue>{months[currentMonth]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {months.map((month, index) => (
              <SelectItem key={month} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentYear.toString()} onValueChange={handleYearChange}>
          <SelectTrigger className='w-[100px]'>
            <SelectValue>{currentYear}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant='outline'
        size='icon'
        onClick={handleNextMonth}
        className='h-9 w-9'
      >
        <ChevronRight className='h-4 w-4' />
      </Button>

      <Button
        variant='outline'
        onClick={() => onDateChange(new Date())}
        className='ml-2'
      >
        Today
      </Button>
    </div>
  );
}

