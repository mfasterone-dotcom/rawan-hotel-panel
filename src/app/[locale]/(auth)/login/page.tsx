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
import { useRouter } from '@/i18n/routing';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();
  const verifyOtpMutation = useVerifyOtp();
  const t = useTranslations('auth.login');
  const tCommon = useTranslations('common');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [email, setEmail] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resendCountdown, setResendCountdown] = useState<number | null>(null);
  const [loginFormData, setLoginFormData] = useState<LoginFormData | null>(null);
  const isResendingRef = useRef(false);

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
    if (!loginFormData || isResendingRef.current || loginMutation.isPending) return;
    
    isResendingRef.current = true;
    try {
      const response = await loginMutation.mutateAsync(loginFormData);
      setResendCountdown(180); // Reset countdown
      if (response.data?.cooldownSeconds) {
        setCooldownSeconds(response.data.cooldownSeconds);
      }
      toast.success(t('toasts.otpResent'), {
        description: t('toasts.otpResentDescription'),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('toasts.resendFailed');
      toast.error(t('toasts.resendFailed'), {
        description: errorMessage,
      });
    } finally {
      isResendingRef.current = false;
    }
  }, [loginFormData, loginMutation]);

  // Countdown timer effect - only decrements, no auto-resend
  useEffect(() => {
    if (resendCountdown !== null && resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      const response = await loginMutation.mutateAsync(data);
      if (response.data?.requiresOtp) {
        setRequiresOtp(true);
        setEmail(response.data.email || data.email);
        setCooldownSeconds(response.data.cooldownSeconds || null);
        setLoginFormData(data); // Store form data for resend
        setResendCountdown(180); // Start countdown when OTP is required
        isResendingRef.current = false; // Reset resending flag
        otpForm.setValue('email', response.data.email || data.email);
        toast.success(t('toasts.otpSent'), {
          description:
            response.message || t('toasts.otpSentDescription'),
        });
      } else {
        toast.success(t('toasts.loginSuccessful'), {
          description: t('toasts.loginSuccessfulDescription'),
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('toasts.loginFailed');
      toast.error(t('toasts.loginFailed'), {
        description: errorMessage,
      });
    }
  };

  const onOtpSubmit = async (data: VerifyOtpFormData) => {
    try {
      // Ensure OTP is exactly 6 digits
      if (!data.otp || data.otp.length !== 6) {
        toast.error(t('toasts.invalidOtp'), {
          description: t('toasts.invalidOtpDescription'),
        });
        return;
      }
      await verifyOtpMutation.mutateAsync(data);
      toast.success(t('toasts.otpVerified'), {
        description: t('toasts.otpVerifiedDescription'),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('toasts.verificationFailed');
      toast.error(t('toasts.verificationFailed'), {
        description: errorMessage,
      });
    }
  };

  const handleBackToLogin = () => {
    setRequiresOtp(false);
    setCooldownSeconds(null);
    setResendCountdown(null);
    setLoginFormData(null);
    isResendingRef.current = false;
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
            <h1 className='text-3xl font-bold'>{t('verifyOtp.title')}</h1>
            <p className='text-muted-foreground'>{t('verifyOtp.subtitle', { email })}</p>
          </div>

          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className='space-y-4'>
              <div className='flex justify-center'>
                <FormField
                  control={otpForm.control}
                  name='otp'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('verifyOtp.otpLabel')}</FormLabel>
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
                  {t('verifyOtp.back')}
                </Button>
                <Button type='submit' className='flex-1' disabled={verifyOtpMutation.isPending}>
                  {verifyOtpMutation.isPending ? t('verifyOtp.verifying') : t('verifyOtp.verify')}
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
                  ? t('verifyOtp.resending')
                  : resendCountdown !== null && resendCountdown > 0
                  ? t('verifyOtp.resendCountdown', { seconds: resendCountdown })
                  : cooldownSeconds !== null && cooldownSeconds > 0
                  ? t('verifyOtp.resendCountdown', { seconds: cooldownSeconds })
                  : t('verifyOtp.resendCode')}
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
          <h1 className='text-3xl font-bold'>{t('title')}</h1>
          <p className='text-muted-foreground'>{t('subtitle')}</p>
        </div>

        <Form {...loginForm}>
          {/* eslint-disable-next-line react-hooks/refs */}
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className='space-y-4'>
            <FormField
              control={loginForm.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('email')}</FormLabel>
                  <FormControl>
                    <Input type='email' placeholder={t('emailPlaceholder')} {...field} />
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
                  <FormLabel>{t('password')}</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('passwordPlaceholder')}
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
                {t('forgotPassword')}
              </Button>
            </div>

            <Button type='submit' className='w-full' disabled={loginMutation.isPending}>
              {loginMutation.isPending ? t('loggingIn') : t('loginButton')}
            </Button>
            <div className='flex items-center justify-start '>
              <p className='text-sm text-muted-foreground'>{t('dontHaveAccount')}</p>
              <Button
                type='button'
                variant='link'
                className='w-fit'
                onClick={() => router.push('/register')}
              >
                {t('register')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
