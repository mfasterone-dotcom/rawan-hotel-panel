import { z } from 'zod';

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const priceIncreaseRangeSchema = z.object({
  id: z.number().optional(),
  StartDate: dateStringSchema,
  EndDate: dateStringSchema,
  IncreaseValue: z.number().min(0, 'Increase value must be positive').max(1000, 'Increase value must be reasonable'),
}).refine(
  data => {
    const start = new Date(data.StartDate);
    const end = new Date(data.EndDate);
    return end >= start;
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['EndDate'],
  }
);

const priceDecreaseRangeSchema = z.object({
  id: z.number().optional(),
  StartDate: dateStringSchema,
  EndDate: dateStringSchema,
  DecreaseValue: z.number().min(0, 'Decrease value must be positive').max(100, 'Decrease value must be between 0 and 100'),
}).refine(
  data => {
    const start = new Date(data.StartDate);
    const end = new Date(data.EndDate);
    return end >= start;
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['EndDate'],
  }
);

const excludedDateRangeSchema = z.object({
  id: z.number().optional(),
  StartDate: dateStringSchema,
  EndDate: dateStringSchema,
}).refine(
  data => {
    const start = new Date(data.StartDate);
    const end = new Date(data.EndDate);
    return end >= start;
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['EndDate'],
  }
);

export const createRoomSchema = z.object({
  RoomName: z
    .string()
    .min(1, 'Room name is required')
    .max(500, 'Room name must be 1-500 characters'),
  RoomType: z.string().min(1, 'Room type is required'),
  BedsCount: z
    .string()
    .min(1, 'Beds count is required')
    .refine(val => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1 && num <= 100;
    }, 'Beds count must be between 1 and 100'),
  Sqft: z
    .string()
    .min(1, 'Square footage is required')
    .refine(val => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 5 && num <= 10000;
    }, 'Square footage must be between 5 and 10000'),
  Price: z
    .string()
    .min(1, 'Price is required')
    .refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 1 && num <= 1000000;
    }, 'Price must be between 1 and 1,000,000'),
  Facilities: z.array(z.string()).min(1, 'At least one facility is required'),
  FeatureImage: z
    .union([z.instanceof(File), z.undefined()])
    .refine(file => file instanceof File && file.size > 0, 'Feature image is required'),
  GalleryImages: z.array(z.instanceof(File)),
  NumberOfRooms: z
    .string()
    .min(1, 'Number of rooms is required')
    .refine(val => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1;
    }, 'Number of rooms must be at least 1'),
  PriceIncreaseRanges: z.array(priceIncreaseRangeSchema).optional(),
  PriceDecreaseRanges: z.array(priceDecreaseRangeSchema).optional(),
  ExcludedDateRanges: z.array(excludedDateRangeSchema).optional(),
});

export const updateRoomSchema = z.object({
  RoomName: z
    .string()
    .min(1, 'Room name is required')
    .max(500, 'Room name must be 1-500 characters')
    .optional(),
  RoomType: z.string().min(1, 'Room type is required').optional(),
  BedsCount: z
    .string()
    .optional()
    .refine(
      val => {
        if (!val) return true;
        const num = parseInt(val, 10);
        return !isNaN(num) && num >= 1 && num <= 100;
      },
      { message: 'Beds count must be between 1 and 100' },
    ),
  Sqft: z
    .string()
    .optional()
    .refine(
      val => {
        if (!val) return true;
        const num = parseInt(val, 10);
        return !isNaN(num) && num >= 5 && num <= 10000;
      },
      { message: 'Square footage must be between 5 and 10000' },
    ),
  Price: z
    .string()
    .optional()
    .refine(
      val => {
        if (!val) return true;
        const num = parseFloat(val);
        return !isNaN(num) && num >= 1 && num <= 1000000;
      },
      { message: 'Price must be between 1 and 1,000,000' },
    ),
  Facilities: z.array(z.string()).optional(),
  FeatureImage: z.union([z.instanceof(File), z.undefined()]).optional(),
  GalleryImages: z.array(z.instanceof(File)),
  PriceIncreaseRanges: z.array(priceIncreaseRangeSchema).optional(),
  PriceDecreaseRanges: z.array(priceDecreaseRangeSchema).optional(),
  ExcludedDateRanges: z.array(excludedDateRangeSchema).optional(),
});

export type CreateRoomFormData = z.infer<typeof createRoomSchema>;
export type UpdateRoomFormData = z.infer<typeof updateRoomSchema>;
