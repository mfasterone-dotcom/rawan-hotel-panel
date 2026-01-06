'use client';

import { getQueryClient } from '@/lib/utils/query';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

interface IProps {
  children: ReactNode;
}

function QueryProvider({ children }: IProps) {
  const queryClient = getQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export default QueryProvider;
