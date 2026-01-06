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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useFacilities } from '@/hooks/use-facilities';
import { useUpdateProfile } from '@/hooks/use-profile';
import { useCountries } from '@/hooks/use-countries';
import { useGovernments } from '@/hooks/use-governments';
import { updateProfileSchema, type UpdateProfileFormData } from '@/lib/schemes/profile';
import type { Profile } from '@/lib/types/profile';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface ProfileFormProps {
  profile: Profile | null | undefined;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const updateProfileMutation = useUpdateProfile();
  const { data: facilities = [], isLoading: facilitiesLoading } = useFacilities();
  const { data: countries = [], isLoading: countriesLoading } = useCountries();

  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      hotelName: '',
      description: '',
      location: '',
      additionalEmail: '',
      mobile: '',
      additionalMobile: '',
      nearestAirportName: '',
      nearestAirportKm: undefined,
      stars: undefined,
      twoFAEnabled: false,
      isDisabled: false,
      facilityIds: [],
      countryId: null,
      governmentId: null,
    },
  });

  const formCountryId = form.watch('countryId');
  const { data: governments = [], isLoading: governmentsLoading } = useGovernments(formCountryId);

  useEffect(() => {
    if (profile && !countriesLoading) {
      console.log('🔄 [ProfileForm] Resetting form with profile data:', {
        countryId: profile.countryId,
        governmentId: profile.governmentId,
        stars: profile.stars,
        countriesLoaded: countries.length,
        governmentsLoaded: governments.length,
      });
      
      form.reset({
        hotelName: profile.hotelName || '',
        description: profile.description || '',
        location: profile.location || '',
        additionalEmail: profile.additionalEmail || '',
        mobile: profile.mobile || '',
        additionalMobile: profile.additionalMobile || '',
        nearestAirportName: profile.nearestAirportName || '',
        nearestAirportKm: profile.nearestAirportKm ?? undefined,
        stars: profile.stars ?? undefined,
        twoFAEnabled: profile.twoFAEnabled ?? false,
        isDisabled: profile.isDisabled ?? false,
        facilityIds: profile.facilityIds || [],
        countryId: profile.countryId ?? null,
        governmentId: profile.governmentId ?? null,
      });
    }
  }, [profile, form, countriesLoading, countries.length]);

  // Re-set governmentId after governments are loaded for the selected country
  useEffect(() => {
    if (profile?.governmentId && formCountryId === profile.countryId && !governmentsLoading && governments.length > 0) {
      const governmentExists = governments.some(g => g.id === profile.governmentId);
      if (governmentExists && form.getValues('governmentId') !== profile.governmentId) {
        console.log('🔄 [ProfileForm] Setting governmentId after governments loaded:', profile.governmentId);
        form.setValue('governmentId', profile.governmentId);
      }
    }
  }, [profile, formCountryId, governments, governmentsLoading, form]);

  const onSubmit = async (data: UpdateProfileFormData) => {
    // Remove empty strings and convert to proper format
    const updateData: Record<string, unknown> = {};

    if (data.hotelName) updateData.hotelName = data.hotelName;
    if (data.description) updateData.description = data.description;
    if (data.location) updateData.location = data.location;
    if (data.additionalEmail) updateData.additionalEmail = data.additionalEmail;
    if (data.mobile) updateData.mobile = data.mobile;
    if (data.additionalMobile) updateData.additionalMobile = data.additionalMobile;
    if (data.nearestAirportName) updateData.nearestAirportName = data.nearestAirportName;
    if (data.nearestAirportKm !== undefined) updateData.nearestAirportKm = data.nearestAirportKm;
    
    // Always include these fields (even if null/undefined) so they can be cleared
    updateData.stars = data.stars ?? null;
    updateData.countryId = data.countryId ?? null;
    updateData.governmentId = data.governmentId ?? null;
    
    if (data.twoFAEnabled !== undefined) updateData.twoFAEnabled = data.twoFAEnabled;
    if (data.isDisabled !== undefined) updateData.isDisabled = data.isDisabled;
    if (data.facilityIds) updateData.facilityIds = data.facilityIds;

    updateProfileMutation.mutate(updateData);
  };

  const facilityOptions =
    facilities.map(facility => ({
      label: facility.title,
      value: facility.id.toString(),
    })) || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='hotelName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Hotel Name <span className='text-red-500'> *</span>
              </FormLabel>
              <FormControl>
                <Input placeholder='Enter hotel name' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Description <span className='text-red-500'> *</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Enter hotel description'
                  className='resize-none'
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='location'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Location <span className='text-red-500'> *</span>
              </FormLabel>
              <FormControl>
                <Input placeholder='Enter location' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='countryId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select
                  onValueChange={value => {
                    const newCountryId = value === 'none' ? null : parseInt(value, 10);
                    field.onChange(newCountryId);
                    form.setValue('governmentId', null); // Reset government when country changes
                    console.log('🌍 [ProfileForm] Country changed to:', newCountryId);
                  }}
                  value={
                    field.value != null && countries.some(c => c.id === field.value)
                      ? field.value.toString()
                      : 'none'
                  }
                  disabled={countriesLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select country' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='none'>None</SelectItem>
                    {countries.map(country => (
                      <SelectItem key={country.id} value={country.id.toString()}>
                        {country.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='governmentId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Government</FormLabel>
                <Select
                  onValueChange={value => {
                    const newGovernmentId = value === 'none' ? null : parseInt(value, 10);
                    field.onChange(newGovernmentId);
                    console.log('🏛️ [ProfileForm] Government changed to:', newGovernmentId);
                  }}
                  value={
                    field.value != null && governments.some(g => g.id === field.value)
                      ? field.value.toString()
                      : 'none'
                  }
                  disabled={!formCountryId || governmentsLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={formCountryId ? 'Select government' : 'Select country first'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='none'>None</SelectItem>
                    {governments.map(government => (
                      <SelectItem key={government.id} value={government.id.toString()}>
                        {government.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='mobile'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Mobile <span className='text-red-500'> *</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder='Enter mobile number' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='additionalMobile'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Mobile</FormLabel>
                <FormControl>
                  <Input placeholder='Enter additional mobile' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='additionalEmail'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Email</FormLabel>
              <FormControl>
                <Input type='email' placeholder='Enter additional email' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='nearestAirportName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nearest Airport Name</FormLabel>
                <FormControl>
                  <Input readOnly placeholder='Enter airport name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='nearestAirportKm'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distance (km)</FormLabel>
                <FormControl>
                  <Input
                    readOnly
                    type='number'
                    placeholder='Enter distance in km'
                    value={field.value ?? ''}
                    onChange={e =>
                      field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='stars'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Hotel Stars <span className='text-red-500'> *</span>
              </FormLabel>
              <Select
                onValueChange={value => {
                  const stars = parseInt(value, 10);
                  field.onChange(stars);
                  console.log('⭐ [ProfileForm] Stars changed to:', stars);
                }}
                value={field.value != null ? field.value.toString() : undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select hotel stars (1-5)' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='1'>1 Star</SelectItem>
                  <SelectItem value='2'>2 Stars</SelectItem>
                  <SelectItem value='3'>3 Stars</SelectItem>
                  <SelectItem value='4'>4 Stars</SelectItem>
                  <SelectItem value='5'>5 Stars</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='facilityIds'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Facilities <span className='text-red-500'> *</span>
              </FormLabel>
              <FormControl>
                <MultiSelect
                  options={facilityOptions}
                  selected={field.value?.map(String) || []}
                  onChange={selected => {
                    field.onChange(selected.map(Number));
                  }}
                  placeholder='Select facilities'
                  disabled={facilitiesLoading}
                />
              </FormControl>
              <FormDescription>Select the facilities available at your hotel.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex items-center space-x-6'>
          <FormField
            control={form.control}
            name='twoFAEnabled'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>Two-Factor Authentication</FormLabel>
                  <FormDescription>Enable 2FA for enhanced security</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* <div className='flex items-center space-x-6'>
          <FormField
            control={form.control}
            name='isDisabled'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>Disable Account</FormLabel>
                  <FormDescription>Disable your account temporarily</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div> */}

        <Button type='submit' disabled={updateProfileMutation.isPending}>
          {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  );
}
