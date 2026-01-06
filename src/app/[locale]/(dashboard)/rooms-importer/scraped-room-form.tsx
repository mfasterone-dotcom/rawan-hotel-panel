'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFacilities } from '@/hooks/use-facilities';
import { useRoomTypes } from '@/hooks/use-room-types';
import { useCreateRoom } from '@/hooks/use-rooms';
import { createRoomSchema, type CreateRoomFormData } from '@/lib/schemes/room';
import { CreateRoomRequest } from '@/lib/types/room';
import type { ScrapedRoomData } from '@/lib/api/scraping';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Image from 'next/image';
import { X } from 'lucide-react';

interface ScrapedRoomFormProps {
  scrapedRoom: ScrapedRoomData;
  onSuccess?: () => void;
}

// Convert m² to sqft (1 m² = 10.764 sqft)
const convertM2ToSqft = (m2: number): number => {
  return Math.round(m2 * 10.764);
};

export function ScrapedRoomForm({ scrapedRoom, onSuccess }: ScrapedRoomFormProps) {
  const { data: facilities = [], isLoading: facilitiesLoading } = useFacilities();
  const { data: roomTypes = [], isLoading: roomTypesLoading } = useRoomTypes();
  const createRoomMutation = useCreateRoom();

  const [featureImagePreview, setFeatureImagePreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const form = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      RoomName: scrapedRoom.name || '',
      RoomType: '',
      BedsCount: scrapedRoom.beds > 0 ? scrapedRoom.beds.toString() : '',
      Sqft: scrapedRoom.room_size_m2 > 0 ? convertM2ToSqft(scrapedRoom.room_size_m2).toString() : '',
      Price: '',
      Facilities: [],
      FeatureImage: undefined,
      GalleryImages: [],
      NumberOfRooms: '1',
      PriceIncreaseRanges: [],
      ExcludedDateRanges: [],
    },
  });

  const facilityOptions =
    facilities.map(facility => ({
      label: facility.title,
      value: facility.id.toString(),
    })) || [];

  const roomTypeOptions =
    roomTypes.map(roomType => ({
      label: roomType.name,
      value: roomType.id.toString(),
    })) || [];

  const onSubmit = async (data: CreateRoomFormData) => {
    try {
      const createData: CreateRoomRequest = {
        RoomName: data.RoomName,
        RoomType: data.RoomType,
        BedsCount: data.BedsCount,
        Sqft: data.Sqft,
        Price: data.Price,
        Facilities: data.Facilities,
        FeatureImage: data.FeatureImage as File,
        GalleryImages: data.GalleryImages,
        NumberOfRooms: data.NumberOfRooms,
        PriceIncreaseRanges: data.PriceIncreaseRanges || [],
        ExcludedDateRanges: data.ExcludedDateRanges || [],
      };
      await createRoomMutation.mutateAsync(createData);
      toast.success('Room created successfully');
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
      toast.error(errorMessage);
    }
  };

  const handleFeatureImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('FeatureImage', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeatureImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const currentImages = form.getValues('GalleryImages') || [];
      form.setValue('GalleryImages', [...currentImages, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGalleryImage = (index: number) => {
    const currentImages = form.getValues('GalleryImages') || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    form.setValue('GalleryImages', newImages);
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {/* Scraped Data Info */}
        <div className='rounded-lg border bg-muted/50 p-4 space-y-2'>
          <h4 className='text-sm font-semibold'>Scraped Data</h4>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
            {scrapedRoom.guests > 0 && (
              <div>
                <span className='text-muted-foreground'>Guests: </span>
                <span className='font-medium'>{scrapedRoom.guests}</span>
              </div>
            )}
            {scrapedRoom.room_size_m2 > 0 && (
              <div>
                <span className='text-muted-foreground'>Size: </span>
                <span className='font-medium'>{scrapedRoom.room_size_m2} m²</span>
              </div>
            )}
            {scrapedRoom.bed_rating > 0 && (
              <div>
                <span className='text-muted-foreground'>Bed Rating: </span>
                <span className='font-medium'>{scrapedRoom.bed_rating.toFixed(1)}</span>
              </div>
            )}
            {scrapedRoom.smoking_policy && (
              <div>
                <span className='text-muted-foreground'>Smoking: </span>
                <span className='font-medium'>{scrapedRoom.smoking_policy}</span>
              </div>
            )}
          </div>
          {scrapedRoom.amenities && scrapedRoom.amenities.length > 0 && (
            <div className='mt-2'>
              <span className='text-xs text-muted-foreground'>Amenities: </span>
              <div className='flex flex-wrap gap-1 mt-1'>
                {scrapedRoom.amenities.slice(0, 5).map((amenity, idx) => (
                  <span key={idx} className='rounded-full bg-secondary px-2 py-0.5 text-xs'>
                    {amenity}
                  </span>
                ))}
                {scrapedRoom.amenities.length > 5 && (
                  <span className='text-xs text-muted-foreground'>
                    +{scrapedRoom.amenities.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='RoomName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Name *</FormLabel>
                <FormControl>
                  <Input placeholder='Deluxe Suite' {...field} />
                </FormControl>
                <FormDescription>Room name (required, 1-500 characters)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='RoomType'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select room type' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roomTypesLoading ? (
                      <div className='px-2 py-1.5 text-sm text-muted-foreground'>
                        Loading room types...
                      </div>
                    ) : roomTypeOptions.length === 0 ? (
                      <div className='px-2 py-1.5 text-sm text-muted-foreground'>
                        No room types available
                      </div>
                    ) : (
                      roomTypeOptions.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>Select the room type (required)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='BedsCount'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Beds Count *</FormLabel>
                <FormControl>
                  <Input type='number' placeholder='2' min={1} max={100} {...field} />
                </FormControl>
                <FormDescription>Number of beds (required, min: 1, max: 100)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='Sqft'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Square Footage *</FormLabel>
                <FormControl>
                  <Input type='number' placeholder='500' min={5} max={10000} {...field} />
                </FormControl>
                <FormDescription>Square footage (required, min: 5, max: 10000)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='Price'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price *</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='150.50'
                    min={1}
                    max={1000000}
                    step='0.01'
                    {...field}
                  />
                </FormControl>
                <FormDescription>Room price (required, min: 1, max: 1,000,000)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='NumberOfRooms'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Rooms *</FormLabel>
                <FormControl>
                  <Input type='number' placeholder='5' min={1} {...field} />
                </FormControl>
                <FormDescription>Number of identical rooms to create (required)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='Facilities'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Facilities *</FormLabel>
              <FormControl>
                <MultiSelect
                  options={facilityOptions}
                  selected={field.value}
                  onChange={field.onChange}
                  placeholder={facilitiesLoading ? 'Loading facilities...' : 'Select facilities'}
                />
              </FormControl>
              <FormDescription>Select at least one facility</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='space-y-2'>
          <FormLabel>Feature Image *</FormLabel>
          <div className='space-y-4'>
            {featureImagePreview && (
              <div className='relative h-48 w-full overflow-hidden rounded-md border'>
                <Image
                  src={featureImagePreview}
                  alt='Feature preview'
                  fill
                  className='object-cover'
                />
              </div>
            )}
            <Input
              type='file'
              accept='image/*'
              onChange={handleFeatureImageChange}
              className='cursor-pointer'
            />
            <p className='text-sm text-muted-foreground'>
              Feature image file (required, max 10MB)
            </p>
            {form.formState.errors.FeatureImage && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.FeatureImage.message}
              </p>
            )}
          </div>
        </div>

        <div className='space-y-2'>
          <FormLabel>Gallery Images</FormLabel>
          <div className='space-y-4'>
            {galleryPreviews.length > 0 && (
              <div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
                {galleryPreviews.map((preview, index) => (
                  <div key={index} className='relative h-32 w-full overflow-hidden rounded-md border'>
                    <Image src={preview} alt={`Gallery ${index + 1}`} fill className='object-cover' />
                    <Button
                      type='button'
                      variant='destructive'
                      size='icon'
                      className='absolute right-2 top-2 h-6 w-6'
                      onClick={() => removeGalleryImage(index)}
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Input
              type='file'
              accept='image/*'
              multiple
              onChange={handleGalleryImagesChange}
              className='cursor-pointer'
            />
            <p className='text-sm text-muted-foreground'>
              Gallery image files (optional, multiple files allowed, max 10MB each)
            </p>
          </div>
        </div>

        <div className='flex justify-end gap-2'>
          <Button
            type='submit'
            disabled={createRoomMutation.isPending}
          >
            {createRoomMutation.isPending ? 'Creating...' : 'Create Room'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

