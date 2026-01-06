'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfile } from '@/hooks/use-profile';
import { useTranslations } from 'next-intl';
import { ChangeEmailForm } from './change-email-form';
import { ProfileForm } from './profile-form';

export default function SettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const t = useTranslations('settings');

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='mt-2 h-4 w-96' />
        </div>
        <Skeleton className='h-96 w-full' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>{t('title')}</h1>
        <p className='text-muted-foreground'>{t('subtitle')}</p>
      </div>

      <Tabs defaultValue='profile' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='profile'>{t('tabs.profile')}</TabsTrigger>
          <TabsTrigger value='email'>{t('tabs.email')}</TabsTrigger>
        </TabsList>

        <TabsContent value='profile' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.title')}</CardTitle>
              <CardDescription>{t('profile.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm profile={profile} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='email' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>{t('email.title')}</CardTitle>
              <CardDescription>
                {t('email.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangeEmailForm currentEmail={profile?.email} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
