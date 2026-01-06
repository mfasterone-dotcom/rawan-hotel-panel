import { baseURL } from './config';

export const getImageUrl = (path: string | undefined | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // If path starts with /, it's relative to baseURL
  if (path.startsWith('/')) {
    return baseURL ? `${baseURL}${path}` : path;
  }
  return baseURL ? `${baseURL}/${path}` : path;
};
