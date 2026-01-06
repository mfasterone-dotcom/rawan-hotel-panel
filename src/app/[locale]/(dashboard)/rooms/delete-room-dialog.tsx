'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteRoom } from '@/hooks/use-rooms';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteRoomDialogProps {
  roomId: number | null;
  roomName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteRoomDialog({
  roomId,
  roomName,
  open,
  onOpenChange,
}: DeleteRoomDialogProps) {
  const deleteRoomMutation = useDeleteRoom();

  const handleDelete = async () => {
    if (!roomId) return;

    try {
      await deleteRoomMutation.mutateAsync(roomId);
      toast.success('Room deleted successfully');
      onOpenChange(false);
    } catch {
      toast.error('Failed to delete room');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-destructive' />
            <DialogTitle>Delete Room</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete <strong>{roomName}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={deleteRoomMutation.isPending}
          >
            {deleteRoomMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}









