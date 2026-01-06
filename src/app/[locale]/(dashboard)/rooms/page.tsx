'use client';

import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFacilities } from '@/hooks/use-facilities';
import { useRoomTypes } from '@/hooks/use-room-types';
import { useRooms } from '@/hooks/use-rooms';
import { Eye, MoreHorizontal, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { DeleteRoomDialog } from './delete-room-dialog';
import { RoomDetailsDialog } from './room-details-dialog';
import { RoomForm } from './room-form';

export default function RoomsPage() {
  const { data: rooms = [], isLoading } = useRooms();
  const { data: roomTypes = [] } = useRoomTypes();
  const { data: facilities = [] } = useFacilities();
  const t = useTranslations('rooms');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // Helper function to get room type name by ID
  const getRoomTypeName = (roomTypeId: number) => {
    const roomType = roomTypes.find(rt => rt.id === roomTypeId);
    return roomType?.name || roomTypeId.toString();
  };

  // Helper function to get facility name by ID
  const getFacilityName = (facilityId: number) => {
    const facility = facilities.find(f => f.id === facilityId);
    return facility?.title || facilityId.toString();
  };
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<number | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<{ id: number; name: string } | null>(null);
  const [viewingRoomId, setViewingRoomId] = useState<number | null>(null);

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
          <TableSkeleton rows={5} columns={8} />
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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='mr-2 h-4 w-4' />
              {t('addRoom')}
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>{t('createRoom')}</DialogTitle>
              <DialogDescription>{t('createRoomDescription')}</DialogDescription>
            </DialogHeader>
            <RoomForm
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                toast.success(t('toasts.roomCreated'));
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.roomName')}</TableHead>
              <TableHead>{t('table.type')}</TableHead>
              <TableHead>{t('table.beds')}</TableHead>
              <TableHead>{t('table.sqft')}</TableHead>
              <TableHead>{t('table.price')}</TableHead>
              <TableHead>{t('table.facilities')}</TableHead>
              <TableHead>{t('table.numberOfRooms')}</TableHead>
              <TableHead>{t('table.rating')}</TableHead>
              <TableHead className='text-right'>{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className='text-center py-8 text-muted-foreground'>
                  {t('table.noRooms')}
                </TableCell>
              </TableRow>
            ) : (
              rooms.map(room => (
                <TableRow key={room.id}>
                  <TableCell className='font-medium'>{room.roomName}</TableCell>
                  <TableCell>{getRoomTypeName(room.roomType)}</TableCell>
                  <TableCell>{room.bedsCount}</TableCell>
                  <TableCell>{room.sqft}</TableCell>
                  <TableCell className='font-semibold'>
                    {new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(room.price || 0)}
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {room.facilities.slice(0, 3).map(facilityId => (
                        <span
                          key={facilityId}
                          className='rounded-full bg-secondary px-2 py-0.5 text-xs'
                        >
                          {getFacilityName(facilityId)}
                        </span>
                      ))}
                      {room.facilities.length > 3 && (
                        <span className='text-xs text-muted-foreground'>
                          +{room.facilities.length - 3}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{room.numberOfRooms || '-'}</TableCell>
                  <TableCell>
                    {room.averageRating !== null && room.averageRating !== undefined ? (
                      <div className='flex items-center gap-1'>
                        <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                        <span className='text-sm font-medium'>
                          {room.averageRating.toFixed(1)}/5
                        </span>
                        {room.reviewCount !== undefined && room.reviewCount > 0 && (
                          <span className='text-xs text-muted-foreground'>
                            ({room.reviewCount} {room.reviewCount === 1 ? 'review' : 'reviews'})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className='text-muted-foreground'>-</span>
                    )}
                  </TableCell>
                  <TableCell className='text-right'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuLabel>{tCommon('labels.actions')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setViewingRoomId(room.id)}>
                          <Eye className='mr-2 h-4 w-4' />
                          {t('table.viewDetails')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingRoom(room.id)}>
                          <Pencil className='mr-2 h-4 w-4' />
                          {t('table.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingRoom({ id: room.id, name: room.roomName })}
                          className='text-destructive'
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          {t('table.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {editingRoom && (
        <Dialog open={!!editingRoom} onOpenChange={() => setEditingRoom(null)}>
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>{t('editRoom')}</DialogTitle>
              <DialogDescription>{t('editRoomDescription')}</DialogDescription>
            </DialogHeader>
            <RoomForm
              roomId={editingRoom}
              onSuccess={() => {
                setEditingRoom(null);
                toast.success(t('toasts.roomUpdated'));
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingRoom && (
        <DeleteRoomDialog
          roomId={deletingRoom.id}
          roomName={deletingRoom.name}
          open={!!deletingRoom}
          onOpenChange={open => !open && setDeletingRoom(null)}
        />
      )}

      {/* Room Details Dialog */}
      {viewingRoomId && (
        <RoomDetailsDialog
          roomId={viewingRoomId}
          open={!!viewingRoomId}
          onOpenChange={open => !open && setViewingRoomId(null)}
        />
      )}
    </div>
  );
}
