'use client';

import { TableSkeleton } from '@/components/shared/table-skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useReviews } from '@/hooks/use-reviews';
import { useRooms } from '@/hooks/use-rooms';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

export default function ReviewsPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>(undefined);
  const { data: reviews = [], isLoading } = useReviews(selectedRoomId);
  const { data: rooms = [] } = useRooms();
  const t = useTranslations('reviews');
  const locale = useLocale();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className='flex items-center gap-1'>
        <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
        <span className='font-medium'>{rating.toFixed(1)}/5</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>{t('title')}</h1>
            <p className='text-muted-foreground'>{t('subtitle')}</p>
          </div>
        </div>
        <div className='rounded-md border p-4'>
          <TableSkeleton rows={5} columns={5} />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>{t('title')}</h1>
          <p className='text-muted-foreground'>{t('subtitle')}</p>
        </div>
        <div className='flex items-center gap-4'>
          <Select
            value={selectedRoomId?.toString() || 'all'}
            onValueChange={value => {
              setSelectedRoomId(value === 'all' ? undefined : parseInt(value, 10));
            }}
          >
            <SelectTrigger className='w-[200px]'>
              <SelectValue placeholder={t('filter.selectRoom')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>{t('filter.allRooms')}</SelectItem>
              {rooms.map(room => (
                <SelectItem key={room.id} value={room.id.toString()}>
                  {room.roomName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.roomName')}</TableHead>
              <TableHead>{t('table.rating')}</TableHead>
              <TableHead>{t('table.comment')}</TableHead>
              <TableHead>{t('table.reviewer')}</TableHead>
              <TableHead>{t('table.date')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-8 text-muted-foreground'>
                  {t('noReviews')}
                </TableCell>
              </TableRow>
            ) : (
              reviews.map(review => (
                <TableRow key={review.id}>
                  <TableCell className='font-medium'>{review.roomName}</TableCell>
                  <TableCell>{renderStars(review.rating)}</TableCell>
                  <TableCell className='max-w-md'>
                    <p className='line-clamp-2'>{review.comment}</p>
                  </TableCell>
                  <TableCell>{review.userName || `User #${review.userId}`}</TableCell>
                  <TableCell>{formatDate(review.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
