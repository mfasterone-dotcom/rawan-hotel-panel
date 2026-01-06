'use client';

export const dynamic = 'force-dynamic';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useLogin, useVerifyOtp } from '@/hooks/use-auth';
import {
  loginSchema,
  verifyOtpSchema,
  type LoginFormData,
  type VerifyOtpFormData,
} from '@/lib/schemes/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();
  const verifyOtpMutation = useVerifyOtp();
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [email, setEmail] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resendCountdown, setResendCountdown] = useState<number | null>(null);
  const [loginFormData, setLoginFormData] = useState<LoginFormData | null>(null);
  const shouldAutoResendRef = useRef(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const otpForm = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      email: '',
      otp: '',
    },
  });

  // Countdown timer effect
  useEffect(() => {
    if (cooldownSeconds && cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(prev => (prev && prev > 0 ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleResendOtp = useCallback(async () => {
    if (!loginFormData) return;
    try {
      const response = await loginMutation.mutateAsync(loginFormData);
      setResendCountdown(180); // Reset countdown
      shouldAutoResendRef.current = true;
      if (response.data?.cooldownSeconds) {
        setCooldownSeconds(response.data.cooldownSeconds);
      }
      toast.success('OTP Resent', {
        description: 'A new verification code has been sent to your email.',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred during resend';
      toast.error('Resend Failed', {
        description: errorMessage,
      });
    }
  }, [loginFormData, loginMutation]);

  // Countdown timer effect for auto-resend
  useEffect(() => {
    if (resendCountdown !== null && resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && shouldAutoResendRef.current && loginFormData) {
      // Auto-resend when countdown reaches 0
      shouldAutoResendRef.current = false;
      handleResendOtp();
    }
  }, [resendCountdown, loginFormData, handleResendOtp]);

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      const response = await loginMutation.mutateAsync(data);
      if (response.data?.requiresOtp) {
        setRequiresOtp(true);
        setEmail(response.data.email || data.email);
        setCooldownSeconds(response.data.cooldownSeconds || null);
        setLoginFormData(data); // Store form data for resend
        setResendCountdown(180); // Start countdown when OTP is required
        shouldAutoResendRef.current = true;
        otpForm.setValue('email', response.data.email || data.email);
        toast.success('OTP Sent', {
          description:
            response.message || 'OTP sent to your email. Please verify to complete login.',
        });
      } else {
        toast.success('Login Successful', {
          description: 'You have been logged in successfully.',
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred during login';
      toast.error('Login Failed', {
        description: errorMessage,
      });
    }
  };

  const onOtpSubmit = async (data: VerifyOtpFormData) => {
    try {
      // Ensure OTP is exactly 6 digits
      if (!data.otp || data.otp.length !== 6) {
        toast.error('Invalid OTP', {
          description: 'Please enter a 6-digit code',
        });
        return;
      }
      await verifyOtpMutation.mutateAsync(data);
      toast.success('OTP Verified', {
        description: 'Login successful!',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid OTP code';
      toast.error('Verification Failed', {
        description: errorMessage,
      });
    }
  };

  const handleBackToLogin = () => {
    setRequiresOtp(false);
    setCooldownSeconds(null);
    setResendCountdown(null);
    setLoginFormData(null);
    shouldAutoResendRef.current = false;
    otpForm.reset();
  };

  if (requiresOtp) {
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
            <h1 className='text-3xl font-bold'>Verify OTP</h1>
            <p className='text-muted-foreground'>Enter the 6-digit code sent to {email}</p>
          </div>

          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className='space-y-4'>
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

              <div className='flex gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  className='flex-1'
                  onClick={handleBackToLogin}
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
                  (resendCountdown !== null && resendCountdown > 0) ||
                  (cooldownSeconds !== null && cooldownSeconds > 0) ||
                  loginMutation.isPending
                }
              >
                {loginMutation.isPending
                  ? 'Resending...'
                  : resendCountdown !== null && resendCountdown > 0
                  ? `Resend Code (${resendCountdown}s)`
                  : cooldownSeconds !== null && cooldownSeconds > 0
                  ? `Resend Code (${cooldownSeconds}s)`
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
          <h1 className='text-3xl font-bold'>Login</h1>
          <p className='text-muted-foreground'>Welcome To Ruwago Hotel Management System</p>
        </div>

        <Form {...loginForm}>
          {/* eslint-disable-next-line react-hooks/refs */}
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className='space-y-4'>
            <FormField
              control={loginForm.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type='email' placeholder='hotel@example.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={loginForm.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder='Enter your password'
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex items-center justify-end gap-2'>
              {/* <p className='text-sm text-muted-foreground'>Forgot your password?</p> */}
              <Button
                type='button'
                variant='link'
                className='w-fit'
                onClick={() => router.push('/forgot-password')}
              >
                Forgot Password
              </Button>
            </div>

            <Button type='submit' className='w-full' disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </Button>
            <div className='flex items-center justify-start '>
              <p className='text-sm text-muted-foreground'>Don&apos;t have an account?</p>
              <Button
                type='button'
                variant='link'
                className='w-fit'
                onClick={() => router.push('/register')}
              >
                Register
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
