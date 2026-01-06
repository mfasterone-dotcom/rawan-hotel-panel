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
import { Label } from '@/components/ui/label';
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
import {
  useCreateRoom,
  useDeleteExcludedDateRange,
  useDeletePriceDecreaseRange,
  useDeletePriceIncreaseRange,
  useRoom,
  useUpdateRoom,
} from '@/hooks/use-rooms';
import {
  createRoomSchema,
  updateRoomSchema,
  type CreateRoomFormData,
  type UpdateRoomFormData,
} from '@/lib/schemes/room';
import { CreateRoomRequest, UpdateRoomRequest } from '@/lib/types/room';
import { getImageUrl } from '@/lib/utils/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import Image from 'next/image';
import { startTransition, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface RoomFormProps {
  roomId?: number;
  onSuccess?: () => void;
}

export function RoomForm({ roomId, onSuccess }: RoomFormProps) {
  const isEdit = !!roomId;
  const { data: room, isLoading: roomLoading } = useRoom(roomId || null);

  // Log room ID when editing
  useEffect(() => {
    if (roomId) {
      console.log('📝 [RoomForm] Editing Room ID:', roomId);
    }
  }, [roomId]);
  const { data: facilities = [], isLoading: facilitiesLoading } = useFacilities();
  const { data: roomTypes = [], isLoading: roomTypesLoading } = useRoomTypes();
  const createRoomMutation = useCreateRoom();
  const updateRoomMutation = useUpdateRoom();
  const deletePriceIncreaseRangeMutation = useDeletePriceIncreaseRange();
  const deletePriceDecreaseRangeMutation = useDeletePriceDecreaseRange();
  const deleteExcludedDateRangeMutation = useDeleteExcludedDateRange();

  const createForm = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      RoomName: '',
      RoomType: '',
      BedsCount: '',
      Sqft: '',
      Price: '',
      Facilities: [],
      FeatureImage: undefined,
      GalleryImages: [],
      NumberOfRooms: '0',
      PriceIncreaseRanges: [],
      PriceDecreaseRanges: [],
      ExcludedDateRanges: [],
    },
  });

  const updateForm = useForm<UpdateRoomFormData>({
    resolver: zodResolver(updateRoomSchema),
    defaultValues: {
      RoomName: '',
      RoomType: '',
      BedsCount: '',
      Sqft: '',
      Price: '',
      Facilities: [],
      FeatureImage: undefined,
      GalleryImages: [],
      PriceIncreaseRanges: [],
      PriceDecreaseRanges: [],
      ExcludedDateRanges: [],
    },
  });

  const [featureImagePreview, setFeatureImagePreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const initializedRoomIdRef = useRef<number | null>(null);

  // Load room data for editing
  useEffect(() => {
    if (room && isEdit && room.id !== initializedRoomIdRef.current && !roomTypesLoading) {
      console.log('📝 [RoomForm] Room data loaded for editing - Room ID:', room.id);
      updateForm.reset({
        RoomName: room.roomName,
        RoomType: room.roomType.toString(),
        BedsCount: room.bedsCount.toString(),
        Sqft: room.sqft.toString(),
        Price: room.price?.toString() || '',
        Facilities: room.facilities.map(f => f.toString()),
        FeatureImage: undefined,
        GalleryImages: [],
      });
      // Ensure RoomType is set after room types are loaded
      updateForm.setValue('RoomType', room.roomType.toString());
      // Preserve IDs from API response
      updateForm.setValue(
        'PriceIncreaseRanges',
        (room.priceIncreaseRanges || []).map(r => ({
          id: r.id, // Preserve ID from API response
          StartDate: r.StartDate,
          EndDate: r.EndDate,
          IncreaseValue: r.IncreaseValue,
        })),
      );
      updateForm.setValue(
        'PriceDecreaseRanges',
        (room.priceDecreaseRanges || []).map(r => ({
          id: r.id, // Preserve ID from API response
          StartDate: r.StartDate,
          EndDate: r.EndDate,
          DecreaseValue: r.DecreaseValue,
        })),
      );
      updateForm.setValue(
        'ExcludedDateRanges',
        (room.excludedDateRanges || []).map(r => ({
          id: r.id, // Preserve ID from API response
          StartDate: r.StartDate,
          EndDate: r.EndDate,
        })),
      );
      initializedRoomIdRef.current = room.id;
      // Use startTransition to defer state updates and avoid setState in effect warning
      startTransition(() => {
        if (room.featureImage) {
          setFeatureImagePreview(room.featureImage);
        }
        if (room.galleryImages) {
          setGalleryPreviews(room.galleryImages);
        }
      });
    }
  }, [room, isEdit, updateForm, roomTypesLoading]);

  // Ensure RoomType is set when room types are loaded (handles case where room types load after room data)
  useEffect(() => {
    if (
      room &&
      isEdit &&
      !roomTypesLoading &&
      roomTypes.length > 0 &&
      room.id === initializedRoomIdRef.current
    ) {
      const currentRoomType = updateForm.getValues('RoomType');
      const expectedRoomType = room.roomType.toString();
      if (currentRoomType !== expectedRoomType) {
        console.log(
          '📝 [RoomForm] Setting RoomType after room types loaded - Room ID:',
          room.id,
          'RoomType:',
          expectedRoomType,
        );
        updateForm.setValue('RoomType', expectedRoomType);
      }
    }
  }, [room, isEdit, roomTypesLoading, roomTypes, updateForm]);

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

  const onSubmit = async (data: CreateRoomFormData | UpdateRoomFormData) => {
    try {
      if (isEdit && roomId) {
        const updateData: UpdateRoomRequest = {};
        const formData = data as UpdateRoomFormData;
        if (formData.RoomName && formData.RoomName.trim()) {
          updateData.RoomName = formData.RoomName.trim();
        }
        if (formData.RoomType && formData.RoomType.trim()) {
          updateData.RoomType = formData.RoomType;
        }
        if (formData.BedsCount && formData.BedsCount.trim()) {
          updateData.BedsCount = formData.BedsCount;
        }
        if (formData.Sqft && formData.Sqft.trim()) {
          updateData.Sqft = formData.Sqft;
        }
        if (formData.Price && formData.Price.trim()) {
          updateData.Price = formData.Price;
        }
        if (formData.Facilities && formData.Facilities.length > 0) {
          updateData.Facilities = formData.Facilities;
        }
        if (formData.FeatureImage instanceof File) {
          updateData.FeatureImage = formData.FeatureImage;
        }
        if (formData.GalleryImages && formData.GalleryImages.length > 0) {
          updateData.GalleryImages = formData.GalleryImages;
        }
        // Filter out empty/invalid date ranges and only include NEW ranges (without IDs)
        if (formData.PriceIncreaseRanges && formData.PriceIncreaseRanges.length > 0) {
          const validNewRanges = formData.PriceIncreaseRanges.filter(
            range =>
              !range.id && // Only include new ranges (without ID)
              range.StartDate &&
              range.EndDate &&
              range.IncreaseValue !== undefined &&
              range.IncreaseValue !== null,
          );
          if (validNewRanges.length > 0) {
            updateData.PriceIncreaseRanges = validNewRanges;
          }
        }
        if (formData.PriceDecreaseRanges && formData.PriceDecreaseRanges.length > 0) {
          const validNewRanges = formData.PriceDecreaseRanges.filter(
            range =>
              !range.id && // Only include new ranges (without ID)
              range.StartDate &&
              range.EndDate &&
              range.DecreaseValue !== undefined &&
              range.DecreaseValue !== null,
          );
          if (validNewRanges.length > 0) {
            updateData.PriceDecreaseRanges = validNewRanges;
          }
        }
        if (formData.ExcludedDateRanges && formData.ExcludedDateRanges.length > 0) {
          const validNewRanges = formData.ExcludedDateRanges.filter(
            range => !range.id && range.StartDate && range.EndDate, // Only include new ranges (without ID)
          );
          if (validNewRanges.length > 0) {
            updateData.ExcludedDateRanges = validNewRanges;
          }
        }
        await updateRoomMutation.mutateAsync({
          roomId,
          data: updateData,
        });
        toast.success('Room updated successfully');
      } else {
        const formData = data as CreateRoomFormData;
        const createData: CreateRoomRequest = {
          RoomName: formData.RoomName,
          RoomType: formData.RoomType,
          BedsCount: formData.BedsCount,
          Sqft: formData.Sqft,
          Price: formData.Price,
          Facilities: formData.Facilities,
          FeatureImage: formData.FeatureImage as File,
          GalleryImages: formData.GalleryImages,
          NumberOfRooms: formData.NumberOfRooms,
          PriceIncreaseRanges: formData.PriceIncreaseRanges,
          PriceDecreaseRanges: formData.PriceDecreaseRanges,
          ExcludedDateRanges: formData.ExcludedDateRanges,
        };
        await createRoomMutation.mutateAsync(createData);
        toast.success('Room created successfully');
      }
      onSuccess?.();
    } catch {
      toast.error(isEdit ? 'Failed to update room' : 'Failed to create room');
    }
  };

  const handleFeatureImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isEdit) {
        updateForm.setValue('FeatureImage', file);
      } else {
        createForm.setValue('FeatureImage', file);
      }
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
      if (isEdit) {
        const currentImages = updateForm.getValues('GalleryImages') || [];
        updateForm.setValue('GalleryImages', [...currentImages, ...files]);
      } else {
        const currentImages = createForm.getValues('GalleryImages') || [];
        createForm.setValue('GalleryImages', [...currentImages, ...files]);
      }
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
    if (isEdit) {
      const currentImages = updateForm.getValues('GalleryImages') || [];
      const newImages = currentImages.filter((_, i) => i !== index);
      updateForm.setValue('GalleryImages', newImages);
    } else {
      const currentImages = createForm.getValues('GalleryImages') || [];
      const newImages = currentImages.filter((_, i) => i !== index);
      createForm.setValue('GalleryImages', newImages);
    }
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  if (isEdit && roomLoading) {
    return <div className='py-8 text-center text-muted-foreground'>Loading room data...</div>;
  }

  // Render form fields JSX
  const renderFormFields = (
    form:
      | ReturnType<typeof useForm<CreateRoomFormData>>
      | ReturnType<typeof useForm<UpdateRoomFormData>>,
    formIsEdit: boolean,
  ) => (
    <>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <FormField
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          control={form.control as any}
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          control={form.control as any}
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          control={form.control as any}
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          control={form.control as any}
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          control={form.control as any}
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

        {!formIsEdit && (
          <FormField
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            control={form.control as any}
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
        )}
      </div>

      <FormField
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        control={form.control as any}
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
        <Label>Feature Image *</Label>
        <div className='space-y-4'>
          {featureImagePreview && (
            <div className='relative h-48 w-full overflow-hidden rounded-md border'>
              <Image
                src={
                  featureImagePreview.startsWith('data:')
                    ? featureImagePreview
                    : getImageUrl(featureImagePreview)
                }
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
            Feature image file {formIsEdit ? '(optional, max 10MB)' : '(required, max 10MB)'}
          </p>
        </div>
      </div>

      <div className='space-y-2'>
        <Label>Gallery Images</Label>
        <div className='space-y-4'>
          {galleryPreviews.length > 0 && (
            <div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
              {galleryPreviews.map((preview, index) => (
                <div key={index} className='relative h-32 w-full overflow-hidden rounded-md border'>
                  <Image
                    src={preview.startsWith('data:') ? preview : getImageUrl(preview)}
                    alt={`Gallery ${index + 1}`}
                    className='h-full w-full object-cover'
                    width={128}
                    height={128}
                  />
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

      {/* Price Increase Ranges */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <Label className='text-base font-semibold'>Price Increase Ranges</Label>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const formValues = form.getValues() as any;
              const currentRanges = (formValues.PriceIncreaseRanges || []) as Array<{
                StartDate: string;
                EndDate: string;
                IncreaseValue: number;
              }>;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (form.setValue as any)('PriceIncreaseRanges', [
                ...currentRanges,
                { StartDate: '', EndDate: '', IncreaseValue: 0 },
              ]);
            }}
          >
            <Plus className='mr-2 h-4 w-4' />
            Add Range
          </Button>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {((form.watch as any)('PriceIncreaseRanges') || []).map(
          (range: { StartDate: string; EndDate: string; IncreaseValue: number }, index: number) => (
            <div key={index} className='rounded-lg border p-4 space-y-4'>
              <div className='flex items-center justify-between'>
                <Label className='text-sm font-medium'>Price Increase Range {index + 1}</Label>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={async () => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const formValues = form.getValues() as any;
                    const currentRanges = (formValues.PriceIncreaseRanges || []) as Array<{
                      id?: number;
                      StartDate: string;
                      EndDate: string;
                      IncreaseValue: number;
                    }>;
                    const rangeToDelete = currentRanges[index];

                    // If it's an existing range (has ID), delete it from the database
                    if (rangeToDelete?.id && isEdit) {
                      try {
                        await deletePriceIncreaseRangeMutation.mutateAsync(rangeToDelete.id);
                        toast.success('Price increase range deleted');
                      } catch {
                        toast.error('Failed to delete price increase range');
                        return; // Don't remove from form if delete failed
                      }
                    }

                    // Remove from form state
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (form.setValue as any)(
                      'PriceIncreaseRanges',
                      currentRanges.filter((_, i) => i !== index),
                    );
                  }}
                  disabled={deletePriceIncreaseRangeMutation.isPending}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <FormField
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  control={form.control as any}
                  name={`PriceIncreaseRanges.${index}.StartDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  control={form.control as any}
                  name={`PriceIncreaseRanges.${index}.EndDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  control={form.control as any}
                  name={`PriceIncreaseRanges.${index}.IncreaseValue`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Increase Value (%)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={0}
                          max={1000}
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ),
        )}
      </div>

      {/* Price Decrease Ranges */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <Label className='text-base font-semibold'>Price Decrease Ranges</Label>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const formValues = form.getValues() as any;
              const currentRanges = (formValues.PriceDecreaseRanges || []) as Array<{
                StartDate: string;
                EndDate: string;
                DecreaseValue: number;
              }>;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (form.setValue as any)('PriceDecreaseRanges', [
                ...currentRanges,
                { StartDate: '', EndDate: '', DecreaseValue: 0 },
              ]);
            }}
          >
            <Plus className='mr-2 h-4 w-4' />
            Add Range
          </Button>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {((form.watch as any)('PriceDecreaseRanges') || []).map(
          (range: { id?: number; StartDate: string; EndDate: string; DecreaseValue: number }, index: number) => (
            <div key={index} className='rounded-lg border p-4 space-y-4'>
              <div className='flex items-center justify-between'>
                <Label className='text-sm font-medium'>Price Decrease Range {index + 1}</Label>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={async () => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const formValues = form.getValues() as any;
                    const currentRanges = (formValues.PriceDecreaseRanges || []) as Array<{
                      id?: number;
                      StartDate: string;
                      EndDate: string;
                      DecreaseValue: number;
                    }>;
                    const rangeToDelete = currentRanges[index];

                    // If it's an existing range (has ID), delete it from the database
                    if (rangeToDelete?.id && isEdit) {
                      try {
                        await deletePriceDecreaseRangeMutation.mutateAsync(rangeToDelete.id);
                        toast.success('Price decrease range deleted');
                      } catch {
                        toast.error('Failed to delete price decrease range');
                        return; // Don't remove from form if delete failed
                      }
                    }

                    // Remove from form state
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (form.setValue as any)(
                      'PriceDecreaseRanges',
                      currentRanges.filter((_, i) => i !== index),
                    );
                  }}
                  disabled={deletePriceDecreaseRangeMutation.isPending}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <FormField
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  control={form.control as any}
                  name={`PriceDecreaseRanges.${index}.StartDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  control={form.control as any}
                  name={`PriceDecreaseRanges.${index}.EndDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  control={form.control as any}
                  name={`PriceDecreaseRanges.${index}.DecreaseValue`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Decrease Value (%)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={0}
                          max={100}
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ),
        )}
      </div>

      {/* Excluded Date Ranges */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <Label className='text-base font-semibold'>Excluded Date Ranges</Label>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const formValues = form.getValues() as any;
              const currentRanges = (formValues.ExcludedDateRanges || []) as Array<{
                StartDate: string;
                EndDate: string;
              }>;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (form.setValue as any)('ExcludedDateRanges', [
                ...currentRanges,
                { StartDate: '', EndDate: '' },
              ]);
            }}
          >
            <Plus className='mr-2 h-4 w-4' />
            Add Range
          </Button>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {((form.watch as any)('ExcludedDateRanges') || []).map(
          (range: { id?: number; StartDate: string; EndDate: string }, index: number) => (
            <div key={index} className='rounded-lg border p-4 space-y-4'>
              <div className='flex items-center justify-between'>
                <Label className='text-sm font-medium'>Excluded Date Range {index + 1}</Label>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={async () => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const formValues = form.getValues() as any;
                    const currentRanges = (formValues.ExcludedDateRanges || []) as Array<{
                      id?: number;
                      StartDate: string;
                      EndDate: string;
                    }>;
                    const rangeToDelete = currentRanges[index];

                    // If it's an existing range (has ID), delete it from the database
                    if (rangeToDelete?.id && isEdit) {
                      try {
                        await deleteExcludedDateRangeMutation.mutateAsync(rangeToDelete.id);
                        toast.success('Excluded date range deleted');
                      } catch {
                        toast.error('Failed to delete excluded date range');
                        return; // Don't remove from form if delete failed
                      }
                    }

                    // Remove from form state
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (form.setValue as any)(
                      'ExcludedDateRanges',
                      currentRanges.filter((_, i) => i !== index),
                    );
                  }}
                  disabled={deleteExcludedDateRangeMutation.isPending}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormField
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  control={form.control as any}
                  name={`ExcludedDateRanges.${index}.StartDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  control={form.control as any}
                  name={`ExcludedDateRanges.${index}.EndDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ),
        )}
      </div>

      <div className='flex justify-end gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={() => {
            form.reset({
              RoomName: '',
              RoomType: '',
              BedsCount: '',
              Sqft: '',
              Price: '',
              Facilities: [],
              FeatureImage: undefined,
              GalleryImages: [],
              NumberOfRooms: formIsEdit ? undefined : '0',
              PriceIncreaseRanges: [],
              PriceDecreaseRanges: [],
              ExcludedDateRanges: [],
            });
            setFeatureImagePreview(null);
            setGalleryPreviews([]);
          }}
        >
          Reset
        </Button>
        <Button
          type='submit'
          disabled={createRoomMutation.isPending || updateRoomMutation.isPending}
        >
          {createRoomMutation.isPending || updateRoomMutation.isPending
            ? 'Saving...'
            : formIsEdit
            ? 'Update Room'
            : 'Create Room'}
        </Button>
      </div>
    </>
  );

  if (isEdit) {
    return (
      <Form {...updateForm}>
        <form onSubmit={updateForm.handleSubmit(onSubmit)} className='space-y-6'>
          {renderFormFields(updateForm, true)}
        </form>
      </Form>
    );
  }

  return (
    <Form {...createForm}>
      <form onSubmit={createForm.handleSubmit(onSubmit)} className='space-y-6'>
        {renderFormFields(createForm, false)}
      </form>
    </Form>
  );
}
