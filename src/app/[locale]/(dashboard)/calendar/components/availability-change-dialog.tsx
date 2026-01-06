'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
import { roomsAPI } from '@/lib/api/rooms';
import { toast } from 'sonner';

interface AvailabilityChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDays: Set<string>;
  roomId: number | null;
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

export function AvailabilityChangeDialog({
  open,
  onOpenChange,
  selectedDays,
  roomId,
  onSuccess,
}: AvailabilityChangeDialogProps) {
  const t = useTranslations('calendar');
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleMarkUnavailable = async () => {
    if (!roomId) {
      toast.error('Please select a room first');
      return;
    }

    setLoading(true);
    try {
      const dateRanges = convertDaysToRanges(selectedDays);
      
      const updateData: any = {
        ExcludedDateRanges: dateRanges,
      };

      await roomsAPI.update(roomId, updateData);
      
      // Invalidate bookings and room data to refresh the calendar
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['room', roomId] }),
        queryClient.invalidateQueries({ queryKey: ['rooms'] }),
      ]);
      
      toast.success('Availability updated successfully');
      onSuccess?.();
      onOpenChange(false);
      
      // Small delay to ensure queries are refreshed before closing
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['bookings'] });
        queryClient.refetchQueries({ queryKey: ['room', roomId] });
      }, 100);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAvailable = async () => {
    if (!roomId) {
      toast.error('Please select a room first');
      return;
    }

    // Note: To mark as available, we would need to delete excluded date ranges
    // This would require a delete API endpoint for excluded ranges
    toast.info('To mark dates as available, please remove them from excluded dates in room settings');
    onOpenChange(false);
  };

  const selectedDaysCount = selectedDays.size;
  const dateRanges = convertDaysToRanges(selectedDays);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Availability</DialogTitle>
          <DialogDescription>
            Manage availability for {selectedDaysCount} selected day{selectedDaysCount !== 1 ? 's' : ''}
            {dateRanges.length > 1 && ` (${dateRanges.length} date ranges)`}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <p className='text-sm text-muted-foreground'>
              Select an action to apply to the selected dates:
            </p>
          </div>
        </div>
        <DialogFooter className='flex-col sm:flex-row gap-2'>
          <Button
            variant='outline'
            onClick={handleMarkAvailable}
            disabled={loading}
            className='flex-1'
          >
            Mark Available
          </Button>
          <Button
            variant='destructive'
            onClick={handleMarkUnavailable}
            disabled={loading}
            className='flex-1'
          >
            {loading ? 'Updating...' : 'Mark Unavailable'}
          </Button>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

