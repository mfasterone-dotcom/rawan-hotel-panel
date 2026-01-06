import { z } from 'zod';

// Note: These schemas use English messages by default
// For translated messages, components should use createTranslatedSchemas from lib/utils/validation
// or pass translation function when creating form with zodResolver
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one symbol'),
});

// Google Maps URL validation regex
const googleMapsUrlRegex =
  /^https?:\/\/(www\.)?(maps\.google\.com|google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl)\/.+/i;

export const registerSchema = z
  .object({
    hotelName: z.string().min(2, 'Hotel name must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    location: z
      .string()
      .min(1, 'Location is required')
      .refine(
        url => googleMapsUrlRegex.test(url),
        'Please enter a valid Google Maps URL (e.g., https://maps.google.com/...)',
      ),
    email: z.string().email('Invalid email address'),
    additionalEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
    mobile: z.string().min(10, 'Mobile number must be at least 10 characters'),
    additionalMobile: z
      .string()
      .min(10, 'Mobile number must be at least 10 characters')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one symbol'),
    passwordConfirm: z.string().min(8, 'Password confirmation is required'),
    stars: z.number().min(1, 'Stars must be at least 1').max(5, 'Stars must be at most 5'),
    facilityIds: z.array(z.number()).min(1, 'Please select at least one facility'),
    countryId: z.number().optional().nullable(),
    governmentId: z.number().optional().nullable(),
  })
  .refine(data => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  });

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const verifyForgotPasswordOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    otp: z
      .string()
      .length(6, 'OTP must be 6 digits')
      .regex(/^\d+$/, 'OTP must contain only numbers'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one symbol'),
    confirmPassword: z.string().min(8, 'Password confirmation is required'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const verifyRegistrationOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
  hotelName: z.string().min(2, 'Hotel name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z
    .string()
    .min(1, 'Location is required')
    .refine(
      url => googleMapsUrlRegex.test(url),
      'Please enter a valid Google Maps URL (e.g., https://maps.google.com/...)',
    ),
  additionalEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  mobile: z.string().min(10, 'Mobile number must be at least 10 characters'),
  additionalMobile: z
    .string()
    .min(10, 'Mobile number must be at least 10 characters')
    .optional()
    .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one symbol'),
  stars: z.number().min(1, 'Stars must be at least 1').max(5, 'Stars must be at most 5'),
  facilityIds: z.array(z.number()).min(1, 'Please select at least one facility'),
  countryId: z.number().optional().nullable(),
  governmentId: z.number().optional().nullable(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type VerifyForgotPasswordOtpFormData = z.infer<typeof verifyForgotPasswordOtpSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type VerifyRegistrationOtpFormData = z.infer<typeof verifyRegistrationOtpSchema>;
