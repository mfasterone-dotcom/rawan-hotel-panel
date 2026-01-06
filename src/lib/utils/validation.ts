import { z } from 'zod';

/**
 * Helper function to create translated validation schemas
 * This should be used in components where translations are available
 */
export function createTranslatedSchemas(t: (key: string) => string) {
  const loginSchema = z.object({
    email: z.string().email(t('validation.invalidEmail')),
    password: z
      .string()
      .min(8, t('validation.passwordMinLength'))
      .regex(/[A-Z]/, t('validation.passwordUppercase'))
      .regex(/\d/, t('validation.passwordNumber'))
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, t('validation.passwordSymbol')),
  });

  const verifyOtpSchema = z.object({
    email: z.string().email(t('validation.invalidEmail')),
    otp: z
      .string()
      .length(6, t('validation.invalidOtp'))
      .regex(/^\d+$/, t('validation.otpNumbersOnly')),
  });

  return {
    loginSchema,
    verifyOtpSchema,
  };
}
