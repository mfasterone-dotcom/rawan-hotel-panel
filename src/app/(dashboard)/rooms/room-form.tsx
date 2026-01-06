'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useCreateRoom, useRoom, useUpdateRoom } from '@/hooks/use-rooms';
import { scrapingAPI } from '@/lib/api/scraping';
import {
  createRoomSchema,
  updateRoomSchema,
  type CreateRoomFormData,
  type UpdateRoomFormData,
} from '@/lib/schemes/room';
import { CreateRoomRequest, UpdateRoomRequest } from '@/lib/types/room';
import { getImageUrl } from '@/lib/utils/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Download, Loader2, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { startTransition, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface RoomFormProps {
  roomId?: number;
  onSuccess?: () => void;
}

// Fake room type data
const ROOM_TYPES = [
  { value: '1', label: 'Suite' },
  { value: '2', label: 'Mini Suite' },
  { value: '3', label: 'Deluxe' },
  { value: '4', label: 'Standard' },
  { value: '5', label: 'Executive' },
  { value: '6', label: 'Presidential' },
  { value: '7', label: 'Family' },
  { value: '8', label: 'Studio' },
];

export function RoomForm({ roomId, onSuccess }: RoomFormProps) {
  const isEdit = !!roomId;
  const { data: room, isLoading: roomLoading } = useRoom(roomId || null);
  const { data: facilities = [], isLoading: facilitiesLoading } = useFacilities();
  const createRoomMutation = useCreateRoom();
  const updateRoomMutation = useUpdateRoom();

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
      ExcludedDateRanges: [],
    },
  });

  const [featureImagePreview, setFeatureImagePreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const initializedRoomIdRef = useRef<number | null>(null);
  const [scrapingDialogOpen, setScrapingDialogOpen] = useState(false);
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedRooms, setScrapedRooms] = useState<any[]>([]);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number | null>(null);

  // Load room data for editing
  useEffect(() => {
    if (room && isEdit && room.id !== initializedRoomIdRef.current) {
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
  }, [room, isEdit, updateForm]);

  const facilityOptions =
    facilities.map(facility => ({
      label: facility.title,
      value: facility.id.toString(),
    })) || [];

  const onSubmit = async (data: CreateRoomFormData | UpdateRoomFormData) => {
    try {
      if (isEdit && roomId) {
        const updateData: UpdateRoomRequest = {};
        const formData = data as UpdateRoomFormData;
        if (formData.RoomName) updateData.RoomName = formData.RoomName;
        if (formData.RoomType) updateData.RoomType = formData.RoomType;
        if (formData.BedsCount) updateData.BedsCount = formData.BedsCount;
        if (formData.Sqft) updateData.Sqft = formData.Sqft;
        if (formData.Price) updateData.Price = formData.Price;
        if (formData.Facilities && formData.Facilities.length > 0) {
          updateData.Facilities = formData.Facilities;
        }
        if (formData.FeatureImage instanceof File) {
          updateData.FeatureImage = formData.FeatureImage;
        }
        if (formData.GalleryImages && formData.GalleryImages.length > 0) {
          updateData.GalleryImages = formData.GalleryImages;
        }
        if (formData.PriceIncreaseRanges && formData.PriceIncreaseRanges.length > 0) {
          updateData.PriceIncreaseRanges = formData.PriceIncreaseRanges;
        }
        if (formData.ExcludedDateRanges && formData.ExcludedDateRanges.length > 0) {
          updateData.ExcludedDateRanges = formData.ExcludedDateRanges;
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

  const handleScrapeBooking = async () => {
    if (!scrapingUrl.trim()) {
      toast.error('Please enter a Booking.com URL');
      return;
    }

    if (!scrapingUrl.includes('booking.com')) {
      toast.error('Please enter a valid Booking.com URL');
      return;
    }

    setIsScraping(true);
    try {
      const response = await scrapingAPI.scrape(scrapingUrl);
      if (response.rooms && response.rooms.length > 0) {
        // Convert new API structure to old expected structure for compatibility
        const convertedRooms = response.rooms.map(room => ({
          name: room.name,
          beds: room.beds,
          guests: room.guests,
          sqrft: Math.round(room.room_size_m2 * 10.764), // Convert m² to sqft
          price: 0, // Price not available in new API structure
          bathroom: 1, // Not available in new API structure
          images: [], // Images not available in new API structure
          facilities: room.amenities || [],
          description: '',
          amenities: room.amenities,
          bed_details: room.bed_details,
          bathroom_features: room.bathroom_features,
          smoking_policy: room.smoking_policy,
          bed_rating: room.bed_rating,
          review_count: room.review_count,
        }));
        setScrapedRooms(convertedRooms);
        toast.success(`Found ${response.rooms.length} room(s)`);
      } else {
        toast.warning('No rooms found.');
        setScrapedRooms([]);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to scrape data from Booking.com');
    } finally {
      setIsScraping(false);
    }
  };

  const handleSelectScrapedRoom = async (roomIndex: number) => {
    const room = scrapedRooms[roomIndex];
    if (!room) return;

    setSelectedRoomIndex(roomIndex);

    // Pre-fill form with scraped data
    if (isEdit) {
      updateForm.setValue('RoomName', room.name || '');
      updateForm.setValue('BedsCount', room.beds?.toString() || '1');
      updateForm.setValue('Sqft', room.sqrft?.toString() || '0');
      updateForm.setValue('Price', room.price?.toString() || '0');
    } else {
      createForm.setValue('RoomName', room.name || '');
      createForm.setValue('BedsCount', room.beds?.toString() || '1');
      createForm.setValue('Sqft', room.sqrft?.toString() || '0');
      createForm.setValue('Price', room.price?.toString() || '0');
    }

    // Handle images - convert URLs to files
    if (room.images && room.images.length > 0) {
      try {
        // Set previews first (these will work even if CORS blocks the fetch)
        setFeatureImagePreview(room.images[0]);
        const galleryPreviews: string[] = room.images.slice(1, Math.min(room.images.length, 10));
        setGalleryPreviews(galleryPreviews);

        // Try to download and convert images to files
        // Note: This may fail due to CORS, but we'll still show the previews
        try {
          // Download and convert first image to feature image
          const featureImageResponse = await fetch(room.images[0], {
            mode: 'cors',
            credentials: 'omit',
          });
          if (featureImageResponse.ok) {
            const featureImageBlob = await featureImageResponse.blob();
            const featureImageFile = new File([featureImageBlob], 'feature-image.jpg', {
              type: featureImageBlob.type || 'image/jpeg',
            });
            if (isEdit) {
              updateForm.setValue('FeatureImage', featureImageFile);
            } else {
              createForm.setValue('FeatureImage', featureImageFile);
            }
          } else {
            toast.warning('Could not download feature image. Please upload manually.');
          }
        } catch (err) {
          console.warn('Failed to download feature image (CORS may be blocking):', err);
          toast.warning(
            'Could not download images automatically. Please upload images manually using the URLs shown.',
          );
        }

        // Download and convert gallery images
        const galleryFiles: File[] = [];
        for (let i = 1; i < Math.min(room.images.length, 10); i++) {
          try {
            const galleryResponse = await fetch(room.images[i], {
              mode: 'cors',
              credentials: 'omit',
            });
            if (galleryResponse.ok) {
              const galleryBlob = await galleryResponse.blob();
              const galleryFile = new File([galleryBlob], `gallery-${i}.jpg`, {
                type: galleryBlob.type || 'image/jpeg',
              });
              galleryFiles.push(galleryFile);
            }
          } catch (err) {
            console.warn(`Failed to load image ${i}:`, err);
          }
        }

        if (galleryFiles.length > 0) {
          if (isEdit) {
            updateForm.setValue('GalleryImages', galleryFiles);
          } else {
            createForm.setValue('GalleryImages', galleryFiles);
          }
        }
      } catch (error) {
        console.error('Error loading images:', error);
        toast.warning(
          'Images are shown as previews. You may need to download and upload them manually due to CORS restrictions.',
        );
      }
    }

    // Handle facilities - try to match with existing facilities
    if (room.facilities && room.facilities.length > 0 && facilities.length > 0) {
      const matchedFacilities: string[] = [];
      room.facilities.forEach((facilityName: string) => {
        const matched = facilities.find(
          f => f.title.toLowerCase().includes(facilityName.toLowerCase()) ||
               facilityName.toLowerCase().includes(f.title.toLowerCase())
        );
        if (matched) {
          matchedFacilities.push(matched.id.toString());
        }
      });
      if (matchedFacilities.length > 0) {
        if (isEdit) {
          updateForm.setValue('Facilities', matchedFacilities);
        } else {
          createForm.setValue('Facilities', matchedFacilities);
        }
      }
    }

    setScrapingDialogOpen(false);
    toast.success('Room data loaded from Booking.com');
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
      {!formIsEdit && (
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 p-4 mb-6 shadow-sm'>
          <div className='flex-1'>
            <h3 className='font-semibold text-lg mb-1 flex items-center gap-2'>
              <Download className='h-5 w-5 text-primary' />
              Import from Booking.com
            </h3>
            <p className='text-sm text-muted-foreground'>
              Quickly import room data, images, and facilities from a Booking.com hotel page
            </p>
          </div>
          <Dialog open={scrapingDialogOpen} onOpenChange={setScrapingDialogOpen}>
            <DialogTrigger asChild>
              <Button type='button' className='shrink-0'>
                <Download className='mr-2 h-4 w-4' />
                Scrape Data
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl'>
              <DialogHeader>
                <DialogTitle>Scrape Room Data from Booking.com</DialogTitle>
                <DialogDescription>
                  Enter a Booking.com hotel URL to automatically extract room information, images, and
                  facilities.
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                {isScraping && (
                  <div className='rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950'>
                    <div className='flex items-start gap-3'>
                      <AlertCircle className='mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400' />
                      <div className='flex-1 space-y-1'>
                        <p className='text-sm font-medium text-amber-800 dark:text-amber-200'>
                          Scraping in progress...
                        </p>
                        <p className='text-xs text-amber-700 dark:text-amber-300'>
                          This process can take up to 5 minutes. Please do not close this page or navigate away.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className='space-y-2'>
                  <Label htmlFor='booking-url'>Booking.com URL</Label>
                  <Input
                    id='booking-url'
                    placeholder='https://www.booking.com/hotel/...'
                    value={scrapingUrl}
                    onChange={e => setScrapingUrl(e.target.value)}
                    disabled={isScraping}
                  />
                </div>
                {!isScraping && (
                  <div className='rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950'>
                    <div className='flex items-start gap-2'>
                      <AlertCircle className='mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400' />
                      <p className='text-xs text-blue-700 dark:text-blue-300'>
                        Note: Scraping can take up to 5 minutes. Please keep this page open during the process.
                      </p>
                    </div>
                  </div>
                )}
                <Button
                  type='button'
                  onClick={handleScrapeBooking}
                  disabled={isScraping || !scrapingUrl.trim()}
                  className='w-full'
                >
                  {isScraping ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <Download className='mr-2 h-4 w-4' />
                      Scrape Data
                    </>
                  )}
                </Button>

                {scrapedRooms.length > 0 && (
                  <div className='space-y-2'>
                    <Label>Select a room to import:</Label>
                    <div className='max-h-96 space-y-2 overflow-y-auto'>
                      {scrapedRooms.map((room, index) => (
                        <div
                          key={index}
                          className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                            selectedRoomIndex === index
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-accent'
                          }`}
                          onClick={() => handleSelectScrapedRoom(index)}
                        >
                          <div className='flex items-start justify-between'>
                            <div className='flex-1'>
                              <h4 className='font-semibold'>{room.name || `Room ${index + 1}`}</h4>
                              {room.description && (
                                <p className='mt-1 text-sm text-muted-foreground line-clamp-2'>
                                  {room.description}
                                </p>
                              )}
                              <div className='mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground'>
                                {room.price > 0 && <span>Price: ${room.price}</span>}
                                {room.beds > 0 && <span>Beds: {room.beds}</span>}
                                {room.bathroom > 0 && <span>Bathrooms: {room.bathroom}</span>}
                                {room.sqrft > 0 && <span>Size: {room.sqrft} sqft</span>}
                                {room.images?.length > 0 && (
                                  <span>Images: {room.images.length}</span>
                                )}
                                {room.facilities?.length > 0 && (
                                  <span>Facilities: {room.facilities.length}</span>
                                )}
                              </div>
                            </div>
                            {selectedRoomIndex === index && (
                              <div className='ml-2 text-primary'>✓</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setScrapingDialogOpen(false);
                    setScrapingUrl('');
                    setScrapedRooms([]);
                    setSelectedRoomIndex(null);
                  }}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

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
                  {ROOM_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
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
                  onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const formValues = form.getValues() as any;
                    const currentRanges = (formValues.PriceIncreaseRanges || []) as Array<{
                      StartDate: string;
                      EndDate: string;
                      IncreaseValue: number;
                    }>;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (form.setValue as any)(
                      'PriceIncreaseRanges',
                      currentRanges.filter((_, i) => i !== index),
                    );
                  }}
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
          (range: { StartDate: string; EndDate: string }, index: number) => (
            <div key={index} className='rounded-lg border p-4 space-y-4'>
              <div className='flex items-center justify-between'>
                <Label className='text-sm font-medium'>Excluded Date Range {index + 1}</Label>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const formValues = form.getValues() as any;
                    const currentRanges = (formValues.ExcludedDateRanges || []) as Array<{
                      StartDate: string;
                      EndDate: string;
                    }>;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (form.setValue as any)(
                      'ExcludedDateRanges',
                      currentRanges.filter((_, i) => i !== index),
                    );
                  }}
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
