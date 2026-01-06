'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { roomsAPI } from '@/lib/api/rooms';
import { toast } from 'sonner';
import type { PriceIncreaseRange, PriceDecreaseRange, UpdateRoomRequest } from '@/lib/types/room';

interface PriceRange {
  startDate?: string;
  StartDate?: string;
  endDate?: string;
  EndDate?: string;
}

interface PriceAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'increase' | 'decrease';
  selectedDays: Set<string>;
  roomId: number | null;
  room?: {
    priceIncreaseRanges?: PriceRange[];
    priceDecreaseRanges?: PriceRange[];
  } | null;
  onSuccess?: () => void;
}

// Convert selected days to date ranges
const convertDaysToRanges = (selectedDays: Set<string>): Array<{ StartDate: string; EndDate: string }> => {
  if (selectedDays.size === 0) return [];

  const sortedDates = Array.from(selectedDays).sort();
  const ranges: Array<{ StartDate: string; EndDate: string }> = [];

  let rangeStart = sortedDates[0];
  let rangeEnd = sortedDates[0];

  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i] + 'T00:00:00');
    const prevDate = new Date(sortedDates[i - 1] + 'T00:00:00');
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

export function PriceAdjustmentDialog({
  open,
  onOpenChange,
  type,
  selectedDays,
  roomId,
  room,
  onSuccess,
}: PriceAdjustmentDialogProps) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Check if any selected days already have the opposite adjustment
  const hasConflict = () => {
    if (!room) return false;
    
    const oppositeRanges = type === 'increase' 
      ? room.priceDecreaseRanges 
      : room.priceIncreaseRanges;
    
    if (!oppositeRanges || oppositeRanges.length === 0) return false;
    
    // Check if any selected day overlaps with opposite ranges
    for (const dayKey of selectedDays) {
      const day = new Date(dayKey + 'T00:00:00');
      for (const range of oppositeRanges) {
        const startDate = (range as PriceRange).startDate || (range as PriceRange).StartDate;
        const endDate = (range as PriceRange).endDate || (range as PriceRange).EndDate;
        if (startDate && endDate) {
          const start = new Date(startDate + 'T00:00:00');
          const end = new Date(endDate + 'T00:00:00');
          if (day >= start && day <= end) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!roomId) {
      toast.error('Please select a room first');
      return;
    }

    // Check for conflicts
    if (hasConflict()) {
      toast.error(
        `Cannot apply ${type === 'increase' ? 'increase' : 'decrease'} to these days. Some selected days already have a ${type === 'increase' ? 'decrease' : 'increase'} applied. Please remove the conflicting adjustments first.`
      );
      return;
    }

    if (!value || parseFloat(value) <= 0) {
      toast.error(`Please enter a valid ${type === 'increase' ? 'increase' : 'decrease'} value`);
      return;
    }

    const numValue = parseInt(value);
    if (type === 'increase' && (numValue < 0 || numValue > 1000)) {
      toast.error('Increase value must be between 0 and 1000 percent');
      return;
    }
    if (type === 'decrease' && (numValue < 0 || numValue > 100)) {
      toast.error('Decrease value must be between 0 and 100 percent');
      return;
    }

    setLoading(true);
    try {
      const dateRanges = convertDaysToRanges(selectedDays);
      
      const updateData: UpdateRoomRequest = {};
      
      if (type === 'increase') {
        updateData.PriceIncreaseRanges = dateRanges.map(range => ({
          StartDate: range.StartDate,
          EndDate: range.EndDate,
          IncreaseValue: numValue,
        })) as PriceIncreaseRange[];
      } else {
        updateData.PriceDecreaseRanges = dateRanges.map(range => ({
          StartDate: range.StartDate,
          EndDate: range.EndDate,
          DecreaseValue: numValue,
        })) as PriceDecreaseRange[];
      }

      await roomsAPI.update(roomId, updateData);
      
      // Invalidate bookings and room data to refresh the calendar
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['room', roomId] }),
        queryClient.invalidateQueries({ queryKey: ['rooms'] }),
      ]);
      
      toast.success(
        `Price ${type === 'increase' ? 'increase' : 'decrease'} applied successfully`
      );
      onSuccess?.();
      onOpenChange(false);
      setValue('');
      
      // Small delay to ensure queries are refreshed before closing
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['bookings'] });
        queryClient.refetchQueries({ queryKey: ['room', roomId] });
      }, 100);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply price adjustment';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedDaysCount = selectedDays.size;
  const dateRanges = convertDaysToRanges(selectedDays);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === 'increase' ? 'Increase Price' : 'Decrease Price'}
          </DialogTitle>
          <DialogDescription>
            Apply {type === 'increase' ? 'price increase' : 'price decrease'} to {selectedDaysCount} selected day{selectedDaysCount !== 1 ? 's' : ''}
            {dateRanges.length > 1 && ` (${dateRanges.length} date ranges)`}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          {hasConflict() && (
            <div className='rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3'>
              <p className='text-sm text-red-800 dark:text-red-200 font-medium'>
                Conflict Detected
              </p>
              <p className='text-xs text-red-700 dark:text-red-300 mt-1'>
                Some selected days already have a {type === 'increase' ? 'price decrease' : 'price increase'} applied. 
                You can only apply one type of adjustment per day. Please remove the conflicting adjustments first.
              </p>
            </div>
          )}
          <div className='space-y-2'>
            <Label htmlFor='value'>
              {type === 'increase' ? 'Increase' : 'Decrease'} Value (%)
            </Label>
            <Input
              id='value'
              type='number'
              min={0}
              max={type === 'increase' ? 1000 : 100}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={`Enter ${type === 'increase' ? 'increase' : 'decrease'} percentage`}
            />
            <p className='text-xs text-muted-foreground'>
              {type === 'increase'
                ? 'Enter a value between 0 and 1000 percent'
                : 'Enter a value between 0 and 100 percent'}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || hasConflict()}>
            {loading ? 'Applying...' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

