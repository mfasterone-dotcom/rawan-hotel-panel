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
import { useDeletePriceIncreaseRange, useDeletePriceDecreaseRange } from '@/hooks/use-rooms';
import { toast } from 'sonner';

interface DeletePriceRangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'increase' | 'decrease';
  rangeId: number | null;
  rangeInfo?: {
    startDate: string;
    endDate: string;
    value: number;
  };
  onSuccess?: () => void;
}

export function DeletePriceRangeDialog({
  open,
  onOpenChange,
  type,
  rangeId,
  rangeInfo,
  onSuccess,
}: DeletePriceRangeDialogProps) {
  const queryClient = useQueryClient();
  const deleteIncreaseMutation = useDeletePriceIncreaseRange();
  const deleteDecreaseMutation = useDeletePriceDecreaseRange();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!rangeId) {
      toast.error('Invalid range ID');
      return;
    }

    setLoading(true);
    try {
      if (type === 'increase') {
        await deleteIncreaseMutation.mutateAsync(rangeId);
        toast.success('Price increase range deleted successfully');
      } else {
        await deleteDecreaseMutation.mutateAsync(rangeId);
        toast.success('Price decrease range deleted successfully');
      }

      // Invalidate queries to refresh the calendar
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['rooms'] }),
        queryClient.invalidateQueries({ queryKey: ['room'] }),
      ]);

      onSuccess?.();
      onOpenChange(false);

      // Small delay to ensure queries are refreshed
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['rooms'] });
        queryClient.refetchQueries({ queryKey: ['room'] });
      }, 100);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `Failed to delete price ${type === 'increase' ? 'increase' : 'decrease'} range`;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Delete Price {type === 'increase' ? 'Increase' : 'Decrease'} Range?
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this price {type === 'increase' ? 'increase' : 'decrease'} range?
            {rangeInfo && (
              <div className='mt-3 p-3 bg-muted rounded-lg space-y-1'>
                <div className='text-sm'>
                  <span className='font-medium'>Date Range:</span>{' '}
                  {formatDate(rangeInfo.startDate)} - {formatDate(rangeInfo.endDate)}
                </div>
                <div className='text-sm'>
                  <span className='font-medium'>{type === 'increase' ? 'Increase' : 'Decrease'} Value:</span>{' '}
                  {type === 'increase' ? '+' : '-'}{rangeInfo.value}%
                </div>
              </div>
            )}
            <p className='mt-3 text-sm text-muted-foreground'>
              This action cannot be undone. The price {type === 'increase' ? 'increase' : 'decrease'} will be removed from the selected date range.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={loading || !rangeId}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

