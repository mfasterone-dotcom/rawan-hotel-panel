'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { useRoom } from '@/hooks/use-rooms';
import { useFacilities } from '@/hooks/use-facilities';
import { getImageUrl } from '@/lib/utils/image';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface RoomDetailsDialogProps {
  roomId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoomDetailsDialog({
  roomId,
  open,
  onOpenChange,
}: RoomDetailsDialogProps) {
  const { data: room, isLoading } = useRoom(roomId);
  const { data: facilities = [] } = useFacilities();

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Loading Room Details</DialogTitle>
            </VisuallyHidden>
          </DialogHeader>
          <div className='py-8 text-center text-muted-foreground'>Loading room details...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!room) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Room Not Found</DialogTitle>
            </VisuallyHidden>
          </DialogHeader>
          <div className='py-8 text-center text-muted-foreground'>Room not found</div>
        </DialogContent>
      </Dialog>
    );
  }

  const getFacilityName = (facilityId: number) => {
    const facility = facilities.find(f => f.id === facilityId);
    return facility?.title || `Facility ${facilityId}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{room.roomName}</DialogTitle>
          <DialogDescription>Room details and information</DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Feature Image */}
          {room.featureImage && (
            <div className='relative h-64 w-full overflow-hidden rounded-lg border'>
              <Image
                src={getImageUrl(room.featureImage)}
                alt={room.roomName}
                fill
                className='object-cover'
              />
            </div>
          )}

          {/* Basic Information */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <h3 className='text-sm font-medium text-muted-foreground mb-1'>Room Type</h3>
              <p className='text-lg font-semibold'>{room.roomType}</p>
            </div>
            <div>
              <h3 className='text-sm font-medium text-muted-foreground mb-1'>Beds Count</h3>
              <p className='text-lg font-semibold'>{room.bedsCount}</p>
            </div>
            <div>
              <h3 className='text-sm font-medium text-muted-foreground mb-1'>Square Footage</h3>
              <p className='text-lg font-semibold'>{room.sqft} sqft</p>
            </div>
            <div>
              <h3 className='text-sm font-medium text-muted-foreground mb-1'>Price</h3>
              <p className='text-lg font-semibold'>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(room.price || 0)}
              </p>
            </div>
            {room.numberOfRooms && (
              <div>
                <h3 className='text-sm font-medium text-muted-foreground mb-1'>
                  Number of Rooms
                </h3>
                <p className='text-lg font-semibold'>{room.numberOfRooms}</p>
              </div>
            )}
          </div>

          {/* Facilities */}
          <div>
            <h3 className='text-sm font-medium text-muted-foreground mb-2'>Facilities</h3>
            <div className='flex flex-wrap gap-2'>
              {room.facilities.map(facilityId => (
                <Badge key={facilityId} variant='secondary'>
                  {getFacilityName(facilityId)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Gallery Images */}
          {room.galleryImages && room.galleryImages.length > 0 && (
            <div>
              <h3 className='text-sm font-medium text-muted-foreground mb-2'>Gallery Images</h3>
              <div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
                {room.galleryImages.map((image, index) => (
                  <div key={index} className='relative h-32 w-full overflow-hidden rounded-md border'>
                    <Image
                      src={getImageUrl(image)}
                      alt={`Gallery ${index + 1}`}
                      fill
                      className='object-cover'
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Increase Ranges */}
          {room.priceIncreaseRanges && room.priceIncreaseRanges.length > 0 && (
            <div>
              <h3 className='text-sm font-medium text-muted-foreground mb-2'>
                Price Increase Ranges
              </h3>
              <div className='space-y-3'>
                {room.priceIncreaseRanges.map((range, index) => (
                  <div
                    key={index}
                    className='rounded-lg border p-4 bg-muted/50'
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm font-semibold'>
                        Price Increase Range {index + 1}
                      </span>
                    </div>
                    <div className='grid grid-cols-1 gap-2 md:grid-cols-3 text-sm'>
                      <div>
                        <span className='text-muted-foreground'>Start Date:</span>{' '}
                        <span className='font-medium'>
                          {new Date(range.StartDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className='text-muted-foreground'>End Date:</span>{' '}
                        <span className='font-medium'>
                          {new Date(range.EndDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className='text-muted-foreground'>Increase Value:</span>{' '}
                        <span className='font-medium'>{range.IncreaseValue}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Excluded Date Ranges */}
          {room.excludedDateRanges && room.excludedDateRanges.length > 0 && (
            <div>
              <h3 className='text-sm font-medium text-muted-foreground mb-2'>
                Excluded Date Ranges
              </h3>
              <div className='space-y-3'>
                {room.excludedDateRanges.map((range, index) => (
                  <div
                    key={index}
                    className='rounded-lg border p-4 bg-muted/50'
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm font-semibold'>
                        Excluded Date Range {index + 1}
                      </span>
                    </div>
                    <div className='grid grid-cols-1 gap-2 md:grid-cols-2 text-sm'>
                      <div>
                        <span className='text-muted-foreground'>Start Date:</span>{' '}
                        <span className='font-medium'>
                          {new Date(range.StartDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className='text-muted-foreground'>End Date:</span>{' '}
                        <span className='font-medium'>
                          {new Date(range.EndDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          {(room.createdAt || room.updatedAt) && (
            <div className='pt-4 border-t'>
              <div className='grid grid-cols-1 gap-2 text-sm text-muted-foreground'>
                {room.createdAt && (
                  <div>
                    <span className='font-medium'>Created:</span>{' '}
                    {new Date(room.createdAt).toLocaleString()}
                  </div>
                )}
                {room.updatedAt && (
                  <div>
                    <span className='font-medium'>Last Updated:</span>{' '}
                    {new Date(room.updatedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
