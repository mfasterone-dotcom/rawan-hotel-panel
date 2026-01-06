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
import { useRoomTypes } from '@/hooks/use-room-types';
import { useRooms } from '@/hooks/use-rooms';
import { Calendar, Eye, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';
import { DeleteRoomDialog } from './delete-room-dialog';
import { RoomDetailsDialog } from './room-details-dialog';
import { RoomForm } from './room-form';

export default function RoomsPage() {
  const { data: rooms = [], isLoading } = useRooms();
  const { data: roomTypes = [] } = useRoomTypes();

  // Helper function to get room type name by ID
  const getRoomTypeName = (roomTypeId: number) => {
    const roomType = roomTypes.find(rt => rt.id === roomTypeId);
    return roomType?.name || roomTypeId.toString();
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
            <h1 className='text-3xl font-bold'>Rooms</h1>
            <p className='text-muted-foreground'>Manage your hotel rooms</p>
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
          <h1 className='text-3xl font-bold'>Rooms</h1>
          <p className='text-muted-foreground'>Manage your hotel rooms</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='mr-2 h-4 w-4' />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Create New Room</DialogTitle>
              <DialogDescription>Add a new room to your hotel</DialogDescription>
            </DialogHeader>
            <div className='overflow-y-auto max-h-[calc(90vh-120px)]'>
              <RoomForm
                onSuccess={() => {
                  setIsCreateDialogOpen(false);
                  toast.success('Room created successfully');
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Beds</TableHead>
              <TableHead>Sqft</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Facilities</TableHead>
              <TableHead>Number of Rooms</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className='text-center py-8 text-muted-foreground'>
                  No rooms found. Create your first room to get started.
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
                    {new Intl.NumberFormat('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(room.price || 0)}
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {room.facilities.slice(0, 3).map(facility => (
                        <span
                          key={facility}
                          className='rounded-full bg-secondary px-2 py-0.5 text-xs'
                        >
                          {facility}
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
                  <TableCell className='text-right'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setViewingRoomId(room.id)}>
                          <Eye className='mr-2 h-4 w-4' />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingRoom(room.id)}>
                          <Pencil className='mr-2 h-4 w-4' />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/calendar?roomId=${room.id}`}>
                            <Calendar className='mr-2 h-4 w-4' />
                            Calendar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingRoom({ id: room.id, name: room.roomName })}
                          className='text-destructive'
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          Delete
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
              <DialogTitle>Edit Room</DialogTitle>
              <DialogDescription>Update room information</DialogDescription>
            </DialogHeader>
            <RoomForm
              roomId={editingRoom}
              onSuccess={() => {
                setEditingRoom(null);
                toast.success('Room updated successfully');
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
