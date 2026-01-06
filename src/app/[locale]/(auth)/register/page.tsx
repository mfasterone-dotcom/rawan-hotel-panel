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
import Image from 'next/image';
// import {
//   InputOTP,
//   InputOTPGroup,
//   InputOTPSeparator,
//   InputOTPSlot,
// } from '@/components/ui/input-otp';
import { MultiSelect } from '@/components/ui/multi-select';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRegister, useVerifyRegistrationOtp } from '@/hooks/use-auth';
import { useFacilities } from '@/hooks/use-facilities';
import { useCountries } from '@/hooks/use-countries';
import { useGovernments } from '@/hooks/use-governments';

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Textarea } from '@/components/ui/textarea';
import {
  registerSchema,
  verifyRegistrationOtpSchema,
  type RegisterFormData,
  type VerifyRegistrationOtpFormData,
} from '@/lib/schemes/auth';
import type { RegisterRequest } from '@/lib/types/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, EyeIcon, EyeOffIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

// Password requirements checker
const checkPasswordRequirements = (password: string) => {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
};

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerMutation = useRegister();
  const verifyOtpMutation = useVerifyRegistrationOtp();
  const { data: facilities, isLoading: facilitiesLoading } = useFacilities();
  const { data: countries = [], isLoading: countriesLoading } = useCountries();
  
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      hotelName: '',
      description: '',
      location: '',
      email: '',
      additionalEmail: '',
      mobile: '',
      additionalMobile: '',
      password: '',
      passwordConfirm: '',
      stars: 1,
      facilityIds: [],
      countryId: null,
      governmentId: null,
    },
  });

  const formCountryId = form.watch('countryId');
  const { data: governments = [], isLoading: governmentsLoading } = useGovernments(formCountryId);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegisterRequest | null>(null);
  const hasResetOtpForm = useRef(false);
  const [resendCountdown, setResendCountdown] = useState<number | null>(null);
  const isResendingRef = useRef(false);

  const otpForm = useForm<VerifyRegistrationOtpFormData>({
    resolver: zodResolver(verifyRegistrationOtpSchema),
    defaultValues: {
      email: '',
      otp: '',
      hotelName: '',
      description: '',
      location: '',
      additionalEmail: '',
      mobile: '',
      additionalMobile: '',
      password: '',
      stars: 1,
      facilityIds: [],
    },
  });

  // Reset OTP form when showing OTP form (only once)
  useEffect(() => {
    if (showOtpForm && registrationData && !hasResetOtpForm.current) {
      otpForm.reset({
        email: registrationData.email,
        // otp: '',
        hotelName: registrationData.hotelName,
        description: registrationData.description,
        location: registrationData.location,
        additionalEmail: registrationData.additionalEmail || '',
        mobile: registrationData.mobile,
        additionalMobile: registrationData.additionalMobile || '',
        password: registrationData.password,
        stars: registrationData.stars,
        facilityIds: registrationData.facilityIds,
        countryId: registrationData.countryId ?? null,
        governmentId: registrationData.governmentId ?? null,
      });
      hasResetOtpForm.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOtpForm, registrationData]);

  // Reset the flag when going back to registration form
  useEffect(() => {
    if (!showOtpForm) {
      hasResetOtpForm.current = false;
      setResendCountdown(null);
      isResendingRef.current = false;
    }
  }, [showOtpForm]);

  const handleResendOtp = useCallback(async () => {
    if (!registrationData || isResendingRef.current || registerMutation.isPending) return;
    
    isResendingRef.current = true;
    try {
      await registerMutation.mutateAsync(registrationData);
      setResendCountdown(180); // Reset countdown
      toast.success('OTP Resent', {
        description: 'A new verification code has been sent to your email.',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred during resend';
      toast.error('Resend Failed', {
        description: errorMessage,
      });
    } finally {
      isResendingRef.current = false;
    }
  }, [registrationData, registerMutation]);

  // Initialize countdown when OTP form is shown
  useEffect(() => {
    if (showOtpForm && registrationData) {
      // Start countdown at 180 seconds
      setResendCountdown(180);
      isResendingRef.current = false; // Reset resending flag
    }
  }, [showOtpForm, registrationData]);

  // Countdown timer effect - only decrements, no auto-resend
  useEffect(() => {
    if (resendCountdown !== null && resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Convert empty strings to null for optional fields
      const submitData = {
        ...data,
        additionalEmail: data.additionalEmail?.trim() || null,
        additionalMobile: data.additionalMobile?.trim() || null,
      };
      console.log(submitData);
      await registerMutation.mutateAsync(submitData);
      setRegistrationData(submitData);
      setShowOtpForm(true);
      toast.success('OTP Sent', {
        description:
          'A verification code has been sent to your email. Please verify to complete registration.',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred during registration';
      toast.error('Registration Failed', {
        description: errorMessage,
      });
    }
  };

  const onOtpSubmit = async (data: VerifyRegistrationOtpFormData) => {
    try {
      // Convert empty strings to null for optional fields
      const submitData = {
        ...data,
        additionalEmail: data.additionalEmail?.trim() || null,
        additionalMobile: data.additionalMobile?.trim() || null,
        countryId: data.countryId || null,
        governmentId: data.governmentId || null,
      };
      await verifyOtpMutation.mutateAsync(submitData);
      toast.success('Registration Successful', {
        description: 'Your account has been created successfully. Welcome!',
      });
      router.push('/login');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid OTP code';
      toast.error('Verification Failed', {
        description: errorMessage,
      });
    }
  };

  const handleBackToRegister = () => {
    setShowOtpForm(false);
    hasResetOtpForm.current = false;
    otpForm.reset();
  };

  const facilityOptions = facilities
    ? facilities.map(facility => ({
        label: facility.title,
        value: facility.id,
      }))
    : [];

  if (showOtpForm && registrationData) {
    return (
      <div className='flex min-h-screen items-center justify-center p-4'>
        <div className='w-full max-w-md space-y-6 rounded-lg border p-6 shadow-lg'>
          <div className='flex justify-center'>
            <Image
              src='/images/logo.JPG'
              alt='Logo'
              width={120}
              height={120}
              className='object-contain'
            />
          </div>
          <div className='space-y-2 text-center'>
            <h1 className='text-3xl font-bold'>Verify Registration</h1>
            <p className='text-muted-foreground'>
              Enter the 6-digit code sent to {registrationData.email}
            </p>
          </div>

          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className='space-y-4'>
              {/* <FormField
                control={otpForm.control}
                name='otp'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OTP Code</FormLabel>
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
              <div className='flex justify-center'>
                <FormField
                  control={otpForm.control}
                  name='otp'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OTP Code</FormLabel>
                      <FormControl>
                        <InputOTP
                          maxLength={6}
                          value={field.value}
                          onChange={value => {
                            // Only allow numbers
                            const numericValue = value.replace(/\D/g, '');
                            field.onChange(numericValue);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          pattern='^[0-9]*$'
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                          </InputOTPGroup>
                          <InputOTPSeparator />
                          <InputOTPGroup>
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {resendCountdown !== null && resendCountdown > 0 && (
                <div className='rounded-md bg-muted p-3 text-sm text-center'>
                  Resend code available in {resendCountdown} seconds
                </div>
              )}

              <div className='flex gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  className='flex-1'
                  onClick={handleBackToRegister}
                  disabled={verifyOtpMutation.isPending}
                >
                  Back
                </Button>
                <Button type='submit' className='flex-1' disabled={verifyOtpMutation.isPending}>
                  {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify'}
                </Button>
              </div>

              <Button
                type='button'
                variant='link'
                className='w-full'
                onClick={handleResendOtp}
                disabled={
                  (resendCountdown !== null && resendCountdown > 0) || registerMutation.isPending
                }
              >
                {registerMutation.isPending
                  ? 'Resending...'
                  : resendCountdown !== null && resendCountdown > 0
                  ? `Resend Code (${resendCountdown}s)`
                  : 'Resend Code'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <div className='w-full max-w-2xl space-y-6 rounded-lg border p-6 shadow-lg'>
        <div className='flex justify-center'>
          <Image
            src='/images/logo.JPG'
            alt='Logo'
            width={120}
            height={120}
            className='object-contain'
          />
        </div>
        <div className='space-y-2 text-center'>
          <h1 className='text-3xl font-bold'>Register</h1>
          <p className='text-muted-foreground'>Create your hotel account to get started</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='hotelName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Hotel Name
                    <span className='text-red-500'> *</span>
                  </FormLabel>

                  <FormControl>
                    <Input placeholder='Grand Hotel' {...field} />
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
                    Description
                    <span className='text-red-500'> *</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter hotel description'
                      className='resize-none'
                      rows={4}
                      maxLength={2000}
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
                    Location (Google Maps URL)
                    <span className='text-red-500'> *</span>
                  </FormLabel>
                  <FormControl>
                    <Input type='url' placeholder='https://maps.google.com/...' {...field} />
                  </FormControl>
                  <FormDescription>
                    Please provide a Google Maps URL for your hotel location. You can get this by
                    searching for your location on Google Maps and copying the URL.
                  </FormDescription>
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
                        field.onChange(value === '' ? null : parseInt(value, 10));
                        form.setValue('governmentId', null); // Reset government when country changes
                      }}
                      value={field.value?.toString() || ''}
                      disabled={countriesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select country' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value=''>None</SelectItem>
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
                      onValueChange={value => field.onChange(value === '' ? null : parseInt(value, 10))}
                      value={field.value?.toString() || ''}
                      disabled={!formCountryId || governmentsLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={formCountryId ? 'Select government' : 'Select country first'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value=''>None</SelectItem>
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

            <FormField
              control={form.control}
              name='stars'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Hotel Stars
                    <span className='text-red-500'> *</span>
                  </FormLabel>
                  <Select
                    onValueChange={value => field.onChange(parseInt(value, 10))}
                    value={field.value?.toString()}
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

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email
                      <span className='text-red-500'> *</span>
                    </FormLabel>
                    <FormControl>
                      <Input type='email' placeholder='info@grandhotel.com' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='additionalEmail'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Email (Optional)</FormLabel>
                    <FormControl>
                      <Input type='email' placeholder='reservations@grandhotel.com' {...field} />
                    </FormControl>
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
                      Mobile
                      <span className='text-red-500'> *</span>
                    </FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder='Enter mobile number'
                      />
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
                    <FormLabel>Additional Mobile (Optional)</FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder='Enter additional mobile number'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => {
                  const passwordValue = field.value || '';
                  const requirements = checkPasswordRequirements(passwordValue);
                  return (
                    <FormItem>
                      <FormLabel>
                        Password
                        <span className='text-red-500'> *</span>
                      </FormLabel>
                      <FormControl>
                        <div className='space-y-2'>
                          <div className='relative'>
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder='SecurePass123!'
                              className='pr-10'
                              {...field}
                            />
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOffIcon className='h-4 w-4 text-muted-foreground' />
                              ) : (
                                <EyeIcon className='h-4 w-4 text-muted-foreground' />
                              )}
                            </Button>
                          </div>
                          {passwordValue && (
                            <div className='space-y-1 text-xs'>
                              <div className='flex items-center gap-2'>
                                {requirements.minLength ? (
                                  <Check className='h-3 w-3 text-green-600' />
                                ) : (
                                  <X className='h-3 w-3 text-muted-foreground' />
                                )}
                                <span
                                  className={
                                    requirements.minLength
                                      ? 'text-green-600'
                                      : 'text-muted-foreground'
                                  }
                                >
                                  At least 8 characters
                                </span>
                              </div>
                              <div className='flex items-center gap-2'>
                                {requirements.hasUppercase ? (
                                  <Check className='h-3 w-3 text-green-600' />
                                ) : (
                                  <X className='h-3 w-3 text-muted-foreground' />
                                )}
                                <span
                                  className={
                                    requirements.hasUppercase
                                      ? 'text-green-600'
                                      : 'text-muted-foreground'
                                  }
                                >
                                  Contains one uppercase letter
                                </span>
                              </div>
                              <div className='flex items-center gap-2'>
                                {requirements.hasNumber ? (
                                  <Check className='h-3 w-3 text-green-600' />
                                ) : (
                                  <X className='h-3 w-3 text-muted-foreground' />
                                )}
                                <span
                                  className={
                                    requirements.hasNumber
                                      ? 'text-green-600'
                                      : 'text-muted-foreground'
                                  }
                                >
                                  Contains one number
                                </span>
                              </div>
                              <div className='flex items-center gap-2'>
                                {requirements.hasSymbol ? (
                                  <Check className='h-3 w-3 text-green-600' />
                                ) : (
                                  <X className='h-3 w-3 text-muted-foreground' />
                                )}
                                <span
                                  className={
                                    requirements.hasSymbol
                                      ? 'text-green-600'
                                      : 'text-muted-foreground'
                                  }
                                >
                                  Contains one symbol
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name='passwordConfirm'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Confirm Password
                      <span className='text-red-500'> *</span>
                    </FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder='SecurePass123!'
                          className='pr-10'
                          {...field}
                        />
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOffIcon className='h-4 w-4 text-muted-foreground' />
                          ) : (
                            <EyeIcon className='h-4 w-4 text-muted-foreground' />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='facilityIds'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facilities</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={facilityOptions}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder={
                        facilitiesLoading ? 'Loading facilities...' : 'Select facilities'
                      }
                    />
                  </FormControl>
                  <FormDescription>Select at least one facility for your hotel</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type='submit'
              className='w-full'
              disabled={registerMutation.isPending || facilitiesLoading}
            >
              {registerMutation.isPending ? 'Registering...' : 'Register'}
            </Button>
            {/* login button */}
            <div className='flex items-center justify-start gap-2'>
              <p className='text-sm text-muted-foreground'>Already have an account?</p>
              <Button
                type='button'
                variant='link'
                className='w-fit'
                onClick={() => router.push('/login')}
              >
                Login
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
