import type {
  CreateRoomRequest,
  RoomResponse,
  RoomsResponse,
  UpdateRoomRequest,
} from '@/lib/types/room';
import { callAPI } from '@/lib/utils/config';

const LANG = 'en';

export const roomsAPI = {
  getAll: async () => {
    return callAPI<RoomsResponse>('GET', `/api/${LANG}/rooms/me`);
  },

  getById: async (roomId: number) => {
    return callAPI<RoomResponse>('GET', `/api/${LANG}/rooms/${roomId}`);
  },

  create: async (data: CreateRoomRequest) => {
    const formData = new FormData();

    formData.append('RoomName', data.RoomName);
    formData.append('RoomType', data.RoomType);
    formData.append('BedsCount', data.BedsCount);
    formData.append('Sqft', data.Sqft);
    formData.append('Price', data.Price);
    formData.append('NumberOfRooms', data.NumberOfRooms);

    // Append facilities
    data.Facilities.forEach((facility, index) => {
      formData.append(`Facilities[${index}]`, facility);
    });

    // Append feature image
    if (data.FeatureImage) {
      formData.append('FeatureImage', data.FeatureImage);
    }

    // Append gallery images
    if (data.GalleryImages && data.GalleryImages.length > 0) {
      data.GalleryImages.forEach(image => {
        formData.append('GalleryImages', image);
      });
    }

    // Append price increase ranges
    if (data.PriceIncreaseRanges && data.PriceIncreaseRanges.length > 0) {
      data.PriceIncreaseRanges.forEach((range, index) => {
        formData.append(`PriceIncreaseRanges[${index}].StartDate`, range.StartDate);
        formData.append(`PriceIncreaseRanges[${index}].EndDate`, range.EndDate);
        formData.append(
          `PriceIncreaseRanges[${index}].IncreaseValue`,
          range.IncreaseValue.toString(),
        );
      });
    }

    // Append excluded date ranges
    if (data.ExcludedDateRanges && data.ExcludedDateRanges.length > 0) {
      data.ExcludedDateRanges.forEach((range, index) => {
        formData.append(`ExcludedDateRanges[${index}].StartDate`, range.StartDate);
        formData.append(`ExcludedDateRanges[${index}].EndDate`, range.EndDate);
      });
    }

    return callAPI<RoomResponse>('POST', `/api/${LANG}/rooms`, formData, undefined, true);
  },

  update: async (roomId: number, data: UpdateRoomRequest) => {
    const formData = new FormData();

    if (data.RoomName && data.RoomName.trim()) {
      formData.append('RoomName', data.RoomName.trim());
    }
    if (data.RoomType && data.RoomType.trim()) {
      formData.append('RoomType', data.RoomType);
    }
    if (data.BedsCount && data.BedsCount.trim()) {
      formData.append('BedsCount', data.BedsCount);
    }
    if (data.Sqft && data.Sqft.trim()) {
      formData.append('Sqft', data.Sqft);
    }
    if (data.Price && data.Price.trim()) {
      formData.append('Price', data.Price);
    }

    // Append facilities if provided
    if (data.Facilities && data.Facilities.length > 0) {
      data.Facilities.forEach((facility, index) => {
        formData.append(`Facilities[${index}]`, facility);
      });
    }

    // Append feature image if provided
    if (data.FeatureImage) {
      formData.append('FeatureImage', data.FeatureImage);
    }

    // Append gallery images if provided
    if (data.GalleryImages && data.GalleryImages.length > 0) {
      data.GalleryImages.forEach(image => {
        formData.append('GalleryImages', image);
      });
    }

    // Append price increase ranges if provided (filter out empty/invalid ranges)
    if (data.PriceIncreaseRanges && data.PriceIncreaseRanges.length > 0) {
      const validRanges = data.PriceIncreaseRanges.filter(
        range => range.StartDate && range.EndDate && range.IncreaseValue !== undefined,
      );
      validRanges.forEach((range, index) => {
        formData.append(`PriceIncreaseRanges[${index}].StartDate`, range.StartDate);
        formData.append(`PriceIncreaseRanges[${index}].EndDate`, range.EndDate);
        formData.append(
          `PriceIncreaseRanges[${index}].IncreaseValue`,
          range.IncreaseValue.toString(),
        );
      });
    }

    // Append price decrease ranges if provided (filter out empty/invalid ranges)
    if (data.PriceDecreaseRanges && data.PriceDecreaseRanges.length > 0) {
      const validRanges = data.PriceDecreaseRanges.filter(
        range => range.StartDate && range.EndDate && range.DecreaseValue !== undefined,
      );
      validRanges.forEach((range, index) => {
        formData.append(`PriceDecreaseRanges[${index}].StartDate`, range.StartDate);
        formData.append(`PriceDecreaseRanges[${index}].EndDate`, range.EndDate);
        formData.append(
          `PriceDecreaseRanges[${index}].DecreaseValue`,
          range.DecreaseValue.toString(),
        );
      });
    }

    // Append excluded date ranges if provided (filter out empty/invalid ranges)
    if (data.ExcludedDateRanges && data.ExcludedDateRanges.length > 0) {
      const validRanges = data.ExcludedDateRanges.filter(
        range => range.StartDate && range.EndDate,
      );
      validRanges.forEach((range, index) => {
        formData.append(`ExcludedDateRanges[${index}].StartDate`, range.StartDate);
        formData.append(`ExcludedDateRanges[${index}].EndDate`, range.EndDate);
      });
    }

    return callAPI<RoomResponse>('PUT', `/api/${LANG}/rooms/${roomId}`, formData, undefined, true);
  },

  delete: async (roomId: number) => {
    return callAPI<{ message: string }>('DELETE', `/api/${LANG}/rooms/${roomId}`);
  },

  deletePriceIncreaseRange: async (rangeId: number) => {
    return callAPI<{ message: string }>(
      'DELETE',
      `/api/${LANG}/rooms/increase-dates/${rangeId}`,
    );
  },

  deletePriceDecreaseRange: async (rangeId: number) => {
    return callAPI<{ message: string }>(
      'DELETE',
      `/api/${LANG}/rooms/decrease-dates/${rangeId}`,
    );
  },

  deleteExcludedDateRange: async (rangeId: number) => {
    return callAPI<{ message: string }>(
      'DELETE',
      `/api/${LANG}/rooms/excluded-dates/${rangeId}`,
    );
  },
};
