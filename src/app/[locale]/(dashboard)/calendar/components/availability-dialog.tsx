'use client';

import { useState } from 'react';
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
import { useTranslations } from 'next-intl';
import { roomsAPI } from '@/lib/api/rooms';
import type { PriceDecreaseRange } from '@/lib/types/room';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface AvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: number | null;
  startDate: Date;
  endDate: Date;
}

export function AvailabilityDialog({
  open,
  onOpenChange,
  roomId,
  startDate,
  endDate,
}: AvailabilityDialogProps) {
  const t = useTranslations('calendar');
  const queryClient = useQueryClient();
  const [action, setAction] = useState<'unavailable' | 'increase' | 'decrease' | null>(null);
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    if (!roomId) {
      toast.error(t('availabilityDialog.selectRoom'));
      return;
    }

    if (!action) {
      toast.error(t('availabilityDialog.selectAction'));
      return;
    }

    if ((action === 'increase' || action === 'decrease') && !value) {
      toast.error(t('availabilityDialog.enterValue'));
      return;
    }

    const numValue = action !== 'unavailable' ? parseFloat(value) : 0;
    if ((action === 'increase' || action === 'decrease') && (isNaN(numValue) || numValue <= 0)) {
      toast.error(t('availabilityDialog.invalidValue'));
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: any = {};

      if (action === 'unavailable') {
        updateData.ExcludedDateRanges = [
          {
            StartDate: formatDate(startDate),
            EndDate: formatDate(endDate),
          },
        ];
      } else if (action === 'increase') {
        updateData.PriceIncreaseRanges = [
          {
            StartDate: formatDate(startDate),
            EndDate: formatDate(endDate),
            IncreaseValue: numValue,
          },
        ];
      } else if (action === 'decrease') {
        const decreaseRange: PriceDecreaseRange = {
          StartDate: formatDate(startDate),
          EndDate: formatDate(endDate),
          DecreaseValue: numValue,
        };
        updateData.PriceDecreaseRanges = [decreaseRange];
      }

      const response = await roomsAPI.update(roomId, updateData);

      if (response.success) {
        toast.success(t('availabilityDialog.success'));
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
        setAction(null);
        setValue('');
        onOpenChange(false);
      } else {
        toast.error(response.message || t('availabilityDialog.error'));
      }
    } catch (error: any) {
      toast.error(error?.message || t('availabilityDialog.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRange = startDate.getTime() !== endDate.getTime();

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setAction(null);
      setValue('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('availabilityDialog.title')}</DialogTitle>
          <DialogDescription>
            {isRange
              ? t('availabilityDialog.descriptionRange', {
                  start: formatDate(startDate),
                  end: formatDate(endDate),
                })
              : t('availabilityDialog.descriptionSingle', { date: formatDate(startDate) })}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {!roomId && (
            <div className='rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800'>
              {t('availabilityDialog.selectRoomWarning')}
            </div>
          )}

          <div className='space-y-3'>
            <Label>{t('availabilityDialog.selectAction')}</Label>
            <div className='grid grid-cols-3 gap-2'>
              <Button
                type='button'
                variant={action === 'unavailable' ? 'default' : 'outline'}
                onClick={() => setAction('unavailable')}
                className='flex flex-col items-center gap-1 h-auto py-3'
              >
                <span className='text-lg'>🚫</span>
                <span className='text-xs'>{t('availabilityDialog.markUnavailable')}</span>
              </Button>
              <Button
                type='button'
                variant={action === 'increase' ? 'default' : 'outline'}
                onClick={() => setAction('increase')}
                className='flex flex-col items-center gap-1 h-auto py-3'
              >
                <span className='text-lg'>📈</span>
                <span className='text-xs'>{t('availabilityDialog.increasePrice')}</span>
              </Button>
              <Button
                type='button'
                variant={action === 'decrease' ? 'default' : 'outline'}
                onClick={() => setAction('decrease')}
                className='flex flex-col items-center gap-1 h-auto py-3'
              >
                <span className='text-lg'>📉</span>
                <span className='text-xs'>{t('availabilityDialog.decreasePrice')}</span>
              </Button>
            </div>
          </div>

          {(action === 'increase' || action === 'decrease') && (
            <div className='space-y-2'>
              <Label htmlFor='value'>
                {action === 'increase'
                  ? t('availabilityDialog.increasePercentage')
                  : t('availabilityDialog.decreasePercentage')}
              </Label>
              <div className='flex items-center gap-2'>
                <Input
                  id='value'
                  type='number'
                  min='0'
                  max={action === 'increase' ? '1000' : '100'}
                  step='0.1'
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder={action === 'increase' ? '10' : '5'}
                />
                <span className='text-sm text-muted-foreground'>%</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t('availabilityDialog.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !action || !roomId}>
            {isSubmitting ? t('availabilityDialog.saving') : t('availabilityDialog.apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

