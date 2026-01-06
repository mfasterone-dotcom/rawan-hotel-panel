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
import { useForgotPassword, useResetPassword, useVerifyForgotPasswordOtp } from '@/hooks/use-auth';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyForgotPasswordOtpSchema,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
  type VerifyForgotPasswordOtpFormData,
} from '@/lib/schemes/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, EyeIcon, EyeOffIcon, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type Step = 1 | 2 | 3;

// Password requirements checker
const checkPasswordRequirements = (password: string) => {
  return {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
};

export default function ForgotPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [resendCountdown, setResendCountdown] = useState<number | null>(null);
  const shouldAutoResendRef = useRef(false);

  const forgotPasswordMutation = useForgotPassword();
  const verifyOtpMutation = useVerifyForgotPasswordOtp();
  const resetPasswordMutation = useResetPassword();

  const step1Form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const step2Form = useForm<VerifyForgotPasswordOtpFormData>({
    resolver: zodResolver(verifyForgotPasswordOtpSchema),
    defaultValues: {
      email: '',
      otp: '',
    },
  });

  const step3Form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
      otp: '',
      newPassword: '',
      confirmPassword: '',
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
    if (!email) return;
    try {
      const response = await forgotPasswordMutation.mutateAsync({ email });
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
  }, [email, forgotPasswordMutation]);

  // Countdown timer effect for auto-resend
  useEffect(() => {
    if (resendCountdown !== null && resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && shouldAutoResendRef.current && email && step === 2) {
      // Auto-resend when countdown reaches 0
      shouldAutoResendRef.current = false;
      handleResendOtp();
    }
  }, [resendCountdown, email, step, handleResendOtp]);

  const onStep1Submit = async (data: ForgotPasswordFormData) => {
    try {
      const response = await forgotPasswordMutation.mutateAsync(data);
      setEmail(data.email);
      setStep(2);
      setCooldownSeconds(response.data?.cooldownSeconds || null);
      setResendCountdown(180); // Start countdown when moving to step 2
      shouldAutoResendRef.current = true;
      step2Form.setValue('email', data.email);
      toast.success('Reset Code Sent', {
        description: response.message || 'A verification code has been sent to your email.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      toast.error('Failed to Send Code', {
        description: errorMessage,
      });
    }
  };

  const onStep2Submit = async (data: VerifyForgotPasswordOtpFormData) => {
    try {
      await verifyOtpMutation.mutateAsync(data);
      setStep(3);
      step3Form.setValue('email', data.email);
      step3Form.setValue('otp', data.otp);
      toast.success('OTP Verified', {
        description: 'Code verified successfully. Please enter your new password.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid OTP code';
      toast.error('Verification Failed', {
        description: errorMessage,
      });
    }
  };

  const onStep3Submit = async (data: ResetPasswordFormData) => {
    try {
      await resetPasswordMutation.mutateAsync(data);
      toast.success('Password Reset Successful', {
        description:
          'Your password has been reset successfully. You can now login with your new password.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      toast.error('Reset Failed', {
        description: errorMessage,
      });
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      step2Form.reset();
      setCooldownSeconds(null);
      setResendCountdown(null);
      shouldAutoResendRef.current = false;
    } else if (step === 3) {
      setStep(2);
      step3Form.reset();
    }
  };

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
        {/* Step Indicator */}
        <div className='flex items-center justify-center'>
          <div className='flex items-center  gap-2'>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              1
            </div>
            <div className={`h-1 w-12 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              2
            </div>
            <div className={`h-1 w-12 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              3
            </div>
          </div>
        </div>

        {/* Step 1: Request Password Reset */}
        {step === 1 && (
          <>
            <div className='space-y-2 text-center'>
              <h1 className='text-3xl font-bold'>Forgot Password</h1>
              <p className='text-muted-foreground'>
                Enter your email address and we&apos;ll send you a verification code
              </p>
            </div>

            <Form {...step1Form}>
              {/* eslint-disable-next-line react-hooks/refs */}
              <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className='space-y-4'>
                <FormField
                  control={step1Form.control}
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

                <div className='flex gap-2'>
                  <Button type='button' variant='link' asChild className='flex-1'>
                    <Link href='/login'>Back to Login</Link>
                  </Button>
                  <Button
                    type='submit'
                    className='flex-1'
                    disabled={forgotPasswordMutation.isPending}
                  >
                    {forgotPasswordMutation.isPending ? 'Sending...' : 'Send Code'}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <>
            <div className='space-y-2 text-center'>
              <h1 className='text-3xl font-bold'>Verify OTP</h1>
              <p className='text-muted-foreground'>Enter the 6-digit code sent to {email}</p>
            </div>

            <Form {...step2Form}>
              <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className='space-y-4'>
                <div className='flex justify-center '>
                  <FormField
                    control={step2Form.control}
                    name='otp'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OTP Code</FormLabel>
                        <FormControl>
                          <InputOTP
                            maxLength={6}
                            {...field}
                            onChange={value => {
                              // Only allow numbers
                              const numericValue = value.replace(/\D/g, '');
                              field.onChange(numericValue);
                            }}
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
                    onClick={handleBack}
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
                    forgotPasswordMutation.isPending
                  }
                >
                  {forgotPasswordMutation.isPending
                    ? 'Resending...'
                    : resendCountdown !== null && resendCountdown > 0
                    ? `Resend Code (${resendCountdown}s)`
                    : cooldownSeconds !== null && cooldownSeconds > 0
                    ? `Resend Code (${cooldownSeconds}s)`
                    : 'Resend Code'}
                </Button>
              </form>
            </Form>
          </>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <>
            <div className='space-y-2 text-center'>
              <h1 className='text-3xl font-bold'>Reset Password</h1>
              <p className='text-muted-foreground'>Enter your new password</p>
            </div>

            <Form {...step3Form}>
              <form onSubmit={step3Form.handleSubmit(onStep3Submit)} className='space-y-4'>
                <FormField
                  control={step3Form.control}
                  name='newPassword'
                  render={({ field }) => {
                    const passwordValue = field.value || '';
                    const requirements = checkPasswordRequirements(passwordValue);
                    return (
                      <FormItem>
                        <FormLabel>
                          New Password
                          <span className='text-red-500'>*</span>
                        </FormLabel>
                        <FormControl>
                          <div className='space-y-2'>
                            <div className='relative'>
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder='Enter your new password'
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
                  control={step3Form.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Confirm Password
                        <span className='text-red-500'>*</span>
                      </FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder='Confirm your new password'
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

                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    className='flex-1'
                    onClick={handleBack}
                    disabled={resetPasswordMutation.isPending}
                  >
                    Back
                  </Button>
                  <Button
                    type='submit'
                    className='flex-1'
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}
