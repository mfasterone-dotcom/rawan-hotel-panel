import { getAccessToken, getRefreshToken, removeTokens, setTokens } from '@/lib/utils/cookies';
import { handleError } from '@/lib/utils/error-handler';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, Method } from 'axios';

// import baseUrl
const envBaseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
export const baseURL = (envBaseURL && envBaseURL.trim()) || 'https://ruwago-hotel-api.alsalhani.com';

// Log for debugging (remove in production)
if (typeof window !== 'undefined') {
  console.log('API Base URL:', baseURL);
}

// Error structure from API - can be array of objects or Record
type ApiErrorArray = Array<{ field: string; message: string }>;
type ApiErrorRecord = Record<string, string | string[]>;
type ApiErrors = ApiErrorArray | ApiErrorRecord;

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: ApiErrors;
}

// ---- Refresh config ----
const DEFAULT_LANG = 'en';
const refreshPath = (lang: string) => `/api/${lang}/auth/refresh-token`;

// Single-flight refresh (prevents 10 parallel 401s => 10 refresh calls)
let refreshPromise: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;

type RetryableConfig = AxiosRequestConfig & {
  _retry?: boolean;
  _skipAuthRefresh?: boolean;
};

async function doRefreshTokens(
  lang: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const rt = await getRefreshToken();
  if (!rt) return null;

  // Use a plain axios call (no interceptors) to avoid infinite loops
  const res = await axios.post(
    `${baseURL}${refreshPath(lang)}`,
    { refreshToken: rt },
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': lang,
      },
    },
  );

  const newAccessToken = res?.data?.data?.accessToken;
  const newRefreshToken = res?.data?.data?.refreshToken;

  if (!newAccessToken || !newRefreshToken) return null;

  await setTokens(newAccessToken, newRefreshToken);
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

function attachInterceptors(api: AxiosInstance, lang: string) {
  // Endpoints that don't require authentication
  const publicEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/verify-otp',
    '/auth/verify-registration-otp',
    '/forgotpassword/forgot-password',
    '/forgotpassword/verify-forgot-password-otp',
    '/forgotpassword/reset-password',
  ];

  // Always attach latest access token to each request (except public endpoints)
  api.interceptors.request.use(async config => {
    const token = await getAccessToken();
    config.headers = config.headers ?? {};
    config.headers['Accept-Language'] = config.headers['Accept-Language'] ?? lang;

    // Check if this is a public endpoint
    const url = config.url || '';
    const isPublicEndpoint = publicEndpoints.some(endpoint => url.includes(endpoint));

    // Only add Authorization header if token exists and it's not a public endpoint
    if (token && !config.headers['Authorization'] && !isPublicEndpoint) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    res => res,
    async (error: AxiosError) => {
      const originalConfig = (error.config ?? {}) as RetryableConfig;
      const status = error.response?.status;

      // Only handle 401 once per request, and never for refresh endpoint itself
      if (
        status !== 401 ||
        originalConfig._retry ||
        originalConfig._skipAuthRefresh ||
        (typeof originalConfig.url === 'string' &&
          originalConfig.url.includes('/auth/refresh-token'))
      ) {
        throw error;
      }

      originalConfig._retry = true;

      try {
        // single-flight
        if (!refreshPromise) {
          refreshPromise = doRefreshTokens(lang);
        }
        const tokens = await refreshPromise;
        refreshPromise = null;

        if (!tokens) {
          await removeTokens();
          throw error;
        }

        // retry original request with new token
        originalConfig.headers = originalConfig.headers ?? {};
        originalConfig.headers['Authorization'] = `Bearer ${tokens.accessToken}`;

        return api.request(originalConfig);
      } catch (e) {
        refreshPromise = null;
        await removeTokens();
        throw e;
      }
    },
  );
}

// server-side axios instance factory (async)
export const baseAPI = async () => {
  const lang = DEFAULT_LANG;

  const api = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': lang,
      Accept: 'application/json',
    },
  });

  attachInterceptors(api, lang);
  return api;
};

// for form data
export const baseAPIForm = async () => {
  const lang = DEFAULT_LANG;

  const api = axios.create({
    baseURL,
    headers: {
      // NOTE: usually better to NOT set multipart boundary manually,
      // axios will set it when FormData is used.
      'Content-Type': 'multipart/form-data',
      'Accept-Language': lang,
      Accept: 'application/json',
    },
  });

  attachInterceptors(api, lang);
  return api;
};

export async function callAPI<T>(
  method: Method,
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
  isForm: boolean = false,
): Promise<ApiResponse<T>> {
  const fullUrl = `${baseURL}${url}`;
  console.log(`🌐 [callAPI] ${method} ${fullUrl}`, data ? { data } : '');
  
  try {
    const api = isForm ? await baseAPIForm() : await baseAPI();

    const response = await api.request<ApiResponse<T>>({
      method,
      url,
      data,
      ...config,
      // Ensure we always expect JSON response
      responseType: 'json',
    });

    const responseData = response.data as unknown;
    
    // Check if response is empty or not valid JSON
    if (!responseData || (typeof responseData === 'string' && responseData.trim() === '')) {
      console.warn(`⚠️ [callAPI] ${method} ${fullUrl} - Empty response body`);
      return {
        success: false,
        message: response.status === 401 
          ? "Authentication required. Please log in."
          : response.status === 403
          ? "Access forbidden."
          : response.status >= 500
          ? "Server error. Please try again later."
          : "Request failed. Please try again.",
        data: undefined as T,
        errors: {},
      };
    }

    // Type guard: ensure responseData is ApiResponse<T>
    const apiResponse = responseData as ApiResponse<T>;

    console.log(`✅ [callAPI] ${method} ${fullUrl} - Success:`, {
      success: apiResponse?.success,
      message: apiResponse?.message,
      hasData: !!apiResponse?.data,
      status: response.status
    });

    // If status is not 2xx, treat as error even if we have data
    if (response.status < 200 || response.status >= 300) {
      return {
        success: apiResponse?.success ?? false,
        data: apiResponse?.data,
        message: apiResponse?.message || `Request failed with status ${response.status}`,
        errors: (apiResponse?.data as { errors?: ApiErrorArray })?.errors || apiResponse?.errors || {},
      };
    }

    return {
      success: apiResponse?.success ?? true,
      data: apiResponse?.data,
      message: apiResponse?.message || 'ok',
      // Check for errors in data.errors (new format) or top-level errors (old format)
      errors: (apiResponse?.data as { errors?: ApiErrorArray })?.errors || apiResponse?.errors || {},
    };
  } catch (error: unknown) {
    console.error(`❌ [callAPI] ${method} ${fullUrl} - Error:`, error);
    
    // Handle specific error types
    if (error && typeof error === 'object' && 'code' in error) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ERR_NETWORK') {
        return {
          success: false,
          message: "Network error. Please check your connection.",
          data: undefined as T,
          errors: {},
        };
      }
    }
    
    return handleError(error) as unknown as ApiResponse<T>;
  }
}
