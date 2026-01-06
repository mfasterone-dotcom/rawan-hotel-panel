'use client';

import { roomsAPI } from '@/lib/api/rooms';
import type { CreateRoomRequest, UpdateRoomRequest } from '@/lib/types/room';
import { extractErrorMessage } from '@/lib/utils/error-handler';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useRooms = () => {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await roomsAPI.getAll();
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to fetch rooms');
        throw new Error(errorMessage);
      }
      return response.data?.rooms || [];
    },
  });
};

export const useRoom = (roomId: number | null) => {
  return useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      if (!roomId) return null;
      const response = await roomsAPI.getById(roomId);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to fetch room');
        throw new Error(errorMessage);
      }
      return response.data?.room || null;
    },
    enabled: !!roomId,
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRoomRequest) => {
      const response = await roomsAPI.create(data);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to create room');
        throw new Error(errorMessage);
      }
      return response.data?.room;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, data }: { roomId: number; data: UpdateRoomRequest }) => {
      const response = await roomsAPI.update(roomId, data);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to update room');
        throw new Error(errorMessage);
      }
      return response.data?.room;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room', variables.roomId] });
    },
  });
};

export const useDeleteRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: number) => {
      const response = await roomsAPI.delete(roomId);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to delete room');
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useDeletePriceIncreaseRange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rangeId: number) => {
      const response = await roomsAPI.deletePriceIncreaseRange(rangeId);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to delete price increase range');
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room'] });
    },
  });
};

export const useDeletePriceDecreaseRange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rangeId: number) => {
      const response = await roomsAPI.deletePriceDecreaseRange(rangeId);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to delete price decrease range');
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room'] });
    },
  });
};

export const useDeleteExcludedDateRange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rangeId: number) => {
      const response = await roomsAPI.deleteExcludedDateRange(rangeId);
      if (!response.success) {
        const errorMessage = extractErrorMessage(response, 'Failed to delete excluded date range');
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room'] });
    },
  });
};









