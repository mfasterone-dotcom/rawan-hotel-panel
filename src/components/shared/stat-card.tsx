'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  isLoading?: boolean;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading = false,
  trend,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>{title}</CardTitle>
          {Icon && <Icon className='h-4 w-4 text-muted-foreground' />}
        </CardHeader>
        <CardContent>
          <Skeleton className='h-8 w-24 mb-1' />
          {description && <Skeleton className='h-4 w-32' />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        {Icon && <Icon className='h-4 w-4 text-muted-foreground' />}
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {description && <p className='text-xs text-muted-foreground mt-1'>{description}</p>}
        {trend && (
          <p
            className={`text-xs mt-1 ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
