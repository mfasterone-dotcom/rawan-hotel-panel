'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { scrapingAPI, type ScrapedRoomData, type ScrapedHotelData } from '@/lib/api/scraping';
import { extractErrorMessage } from '@/lib/utils/error-handler';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ScrapedRoomForm } from './scraped-room-form';

export default function RoomsImporterPage() {
  const [bookingUrl, setBookingUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedRooms, setScrapedRooms] = useState<ScrapedRoomData[]>([]);
  const [hotelData, setHotelData] = useState<ScrapedHotelData | null>(null);

  const handleScrape = async () => {
    if (!bookingUrl.trim()) {
      toast.error('Please enter a Booking.com URL');
      return;
    }

    if (!bookingUrl.includes('booking.com')) {
      toast.error('Please enter a valid Booking.com URL');
      return;
    }

    setIsScraping(true);
    setScrapedRooms([]);
    setHotelData(null);

    try {
      const response = await scrapingAPI.scrape(bookingUrl);
      
      if (response.rooms && response.rooms.length > 0) {
        setScrapedRooms(response.rooms);
        toast.success(`Successfully scraped ${response.rooms.length} room(s)`);
      } else {
        toast.warning('No rooms found in the scraped data');
      }
      
      // Store hotel data for reference
      setHotelData(response);
    } catch (error: unknown) {
      console.error('Scraping error:', error);
      const errorMessage = extractErrorMessage(error, 'Failed to scrape data from Booking.com');
      toast.error(errorMessage);
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Rooms Importer</h1>
        <p className='text-muted-foreground'>
          Import room data, images, and facilities from Booking.com
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scrape Data from Booking.com</CardTitle>
          <CardDescription>
            Enter a Booking.com hotel URL to automatically extract room information, images, and
            facilities.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
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
            <div className='flex gap-2'>
              <Input
                id='booking-url'
                placeholder='https://www.booking.com/hotel/...'
                value={bookingUrl}
                onChange={e => setBookingUrl(e.target.value)}
                disabled={isScraping}
                className='flex-1'
              />
              <Button
                onClick={handleScrape}
                disabled={isScraping || !bookingUrl.trim()}
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
            <p className='text-sm text-muted-foreground'>
              Example: https://www.booking.com/hotel/ae/local-at-jumeirah-village-triangle-by-the-first-collection.html
            </p>
          </div>
        </CardContent>
      </Card>

      {hotelData && (
        <Card>
          <CardHeader>
            <CardTitle>Hotel Information</CardTitle>
            <CardDescription>General information about the hotel</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label className='text-sm font-semibold'>Hotel Name</Label>
                <p className='text-sm'>{hotelData.hotel_name || 'N/A'}</p>
              </div>
            </div>
            {hotelData.facilities && hotelData.facilities.length > 0 && (
              <div>
                <Label className='text-sm font-semibold mb-2 block'>
                  Facilities ({hotelData.facilities.length})
                </Label>
                <div className='flex flex-wrap gap-2'>
                  {hotelData.facilities.map((facility, index) => (
                    <span
                      key={index}
                      className='rounded-full bg-secondary px-3 py-1 text-xs'
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {scrapedRooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Complete Room Information ({scrapedRooms.length} rooms)</CardTitle>
            <CardDescription>
              Review and complete the missing information for each room to import them into your
              system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={`room-0`} className='w-full'>
              <div className='overflow-x-auto pb-2'>
                <TabsList className='inline-flex h-auto min-w-max items-center justify-start gap-2 p-1'>
                  {scrapedRooms.map((room, index) => (
                    <TabsTrigger
                      key={index}
                      value={`room-${index}`}
                      className='whitespace-nowrap px-4 py-2 text-sm'
                    >
                      {room.name || `Room ${index + 1}`}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {scrapedRooms.map((room, index) => (
                <TabsContent key={index} value={`room-${index}`} className='mt-6'>
                  <ScrapedRoomForm
                    scrapedRoom={room}
                    onSuccess={() => {
                      toast.success(`Room "${room.name || `Room ${index + 1}`}" created successfully`);
                    }}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {!isScraping && scrapedRooms.length === 0 && !hotelData && (
        <Card>
          <CardContent className='py-12 text-center'>
            <AlertCircle className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
            <p className='text-muted-foreground'>
              Enter a Booking.com URL above and click &quot;Scrape Data&quot; to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

