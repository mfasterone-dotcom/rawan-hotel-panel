import { IActionState } from '@/lib/types/error-handler';
import { AxiosError } from 'axios';

/**
 * Custom error class that preserves the API response for error extraction
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public response?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Error structure from API - can be array of objects or Record
type ApiErrorArray = Array<{ field: string; message: string }>;
type ApiErrorRecord = Record<string, string | string[]>;
type ApiErrors = ApiErrorArray | ApiErrorRecord;

interface ApiErrorResponse {
  message?: string;
  errors?: ApiErrors;
  data?: {
    errors?: ApiErrorArray;
  };
}

/**
 * Extracts the first specific error message from API error response
 * Falls back to generic message if no specific errors found
 * Can accept either an AxiosError or a response object with errors
 */
export function extractErrorMessage(error: unknown, fallback?: string): string {
  // Handle response object directly (from callAPI - has data.errors or data.data.errors)
  if (error && typeof error === 'object' && 'data' in error && !('response' in error)) {
    const response = error as { data?: { errors?: ApiErrorArray; data?: { errors?: ApiErrorArray } }; message?: string; errors?: ApiErrors };
    
    // Check for errors in data.data.errors array format (new format)
    if (response?.data?.data?.errors && Array.isArray(response.data.data.errors)) {
      const errorArray = response.data.data.errors;
      if (errorArray.length > 0) {
        return errorArray[0].message;
      }
    }

    // Check for errors in data.errors array format
    if (response?.data?.errors && Array.isArray(response.data.errors)) {
      const errorArray = response.data.errors;
      if (errorArray.length > 0) {
        return errorArray[0].message;
      }
    }

    // Check for errors in top-level errors array format
    if (response?.errors && Array.isArray(response.errors)) {
      const errorArray = response.errors;
      if (errorArray.length > 0) {
        return errorArray[0].message;
      }
    }

    // Fall back to generic message
    return response?.message || fallback || 'Something went wrong';
  }

  // Handle AxiosError
  const err = error as AxiosError<ApiErrorResponse>;

  // Check for errors in data.errors array format (new format)
  if (err.response?.data?.data?.errors && Array.isArray(err.response.data.data.errors)) {
    const errorArray = err.response.data.data.errors;
    if (errorArray.length > 0) {
      return errorArray[0].message;
    }
  }

  // Check for errors in top-level errors array format
  if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
    const errorArray = err.response.data.errors;
    if (errorArray.length > 0) {
      return errorArray[0].message;
    }
  }

  // Fall back to generic message or provided fallback
  return err.response?.data?.message || err.message || fallback || 'Something went wrong';
}

export function handleError(error: unknown): IActionState {
  const err = error as AxiosError<ApiErrorResponse>;

  // Handle empty response or non-JSON response (XML parsing errors, etc.)
  if (!err.response || !err.response.data) {
    // Check if response exists but has no data (empty body)
    if (err.response && err.response.status) {
      const statusMessage = err.response.status === 401 
        ? "Authentication required. Please log in."
        : err.response.status === 403
        ? "Access forbidden. You don't have permission to access this resource."
        : err.response.status === 404
        ? "Resource not found."
        : err.response.status >= 500
        ? "Server error. Please try again later."
        : "Request failed. Please try again.";
      
      return {
        success: false,
        message: statusMessage,
        errors: {},
      };
    }
    
    // Network error or no response
    return {
      success: false,
      message: err.message || "Network error. Please check your connection.",
      errors: {},
    };
  }

  // Normalize errors -> لو string حولة لمصفوفة
  const normalizedErrors: Record<string, string[]> = {};

  // Handle array format (new format): [{field: "Password", message: "..."}]
  if (err.response?.data?.data?.errors && Array.isArray(err.response.data.data.errors)) {
    for (const errorObj of err.response.data.data.errors) {
      if (errorObj.field && errorObj.message) {
        normalizedErrors[errorObj.field] = [errorObj.message];
      }
    }
  }
  // Handle array format at top level
  else if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
    for (const errorObj of err.response.data.errors) {
      if (errorObj.field && errorObj.message) {
        normalizedErrors[errorObj.field] = [errorObj.message];
      }
    }
  }
  // Handle Record format (old format): {field: "error message"}
  else if (err.response?.data?.errors && typeof err.response.data.errors === 'object') {
    const errorRecord = err.response.data.errors as ApiErrorRecord;
    for (const key in errorRecord) {
      const value = errorRecord[key];
      normalizedErrors[key] = Array.isArray(value) ? value : [value];
    }
  }

  return {
    success: false,
    message: extractErrorMessage(error),
    errors: normalizedErrors,
  };
}
