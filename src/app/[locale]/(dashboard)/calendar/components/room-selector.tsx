'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import { useRooms } from '@/hooks/use-rooms';

interface RoomSelectorProps {
  rooms: unknown[];
  selectedRoomId: number | null;
  onRoomChange: (roomId: number | null) => void;
}

export function RoomSelector({
  selectedRoomId,
  onRoomChange,
}: RoomSelectorProps) {
  const t = useTranslations('calendar');
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();

  // Only use rooms from the API to ensure consistency with Rooms page
  // This ensures the Calendar dropdown shows the exact same rooms with the same names
  const allRooms = rooms.map(room => ({
    id: room.id,
    title: room.roomName,
  }));

  return (
    <Select
      value={selectedRoomId?.toString() || 'all'}
      onValueChange={value => onRoomChange(value === 'all' ? null : parseInt(value))}
      disabled={roomsLoading}
    >
      <SelectTrigger className='w-[200px]'>
        <SelectValue placeholder={t('roomSelector.allRooms')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='all'>{t('roomSelector.allRooms')}</SelectItem>
        {allRooms.map(room => (
          <SelectItem key={room.id} value={room.id.toString()}>
            {room.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

