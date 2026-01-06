'use client';

import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCreatePayoutProfile,
  useDeletePayoutProfile,
  usePayoutProfile,
  usePayoutProfiles,
  useRequestPayout,
  useUpdatePayoutProfile,
} from '@/hooks/use-payout';
import { useBookings } from '@/hooks/use-bookings';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, Plus, Trash2, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const payoutProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bankName: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
  fullName: z.string().min(1, 'Full name is required'),
  walletNumber: z.string().optional().nullable(),
  methodId: z.number().min(1, 'Method ID is required'),
  status: z.number().min(0).max(1),
});

type PayoutProfileFormData = z.infer<typeof payoutProfileSchema>;

export default function PayoutPage() {
  const { data: payoutProfiles = [], isLoading } = usePayoutProfiles();
  const { data: bookings = [] } = useBookings();
  const createMutation = useCreatePayoutProfile();
  const updateMutation = useUpdatePayoutProfile();
  const deleteMutation = useDeletePayoutProfile();
  const requestPayoutMutation = useRequestPayout();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState<number | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null);
  const [deletingProfileId, setDeletingProfileId] = useState<number | null>(null);
  const [requestingPayout, setRequestingPayout] = useState<{
    profileId: number;
    bookIds: number[];
  } | null>(null);

  const { data: viewingProfile } = usePayoutProfile(viewingProfileId);
  const { data: editingProfile } = usePayoutProfile(editingProfileId);

  const form = useForm<PayoutProfileFormData>({
    resolver: zodResolver(payoutProfileSchema),
    defaultValues: {
      name: '',
      bankName: null,
      bankAccountNumber: null,
      fullName: '',
      walletNumber: null,
      methodId: 1,
      status: 1,
    },
  });

  // Reset form when editing profile loads
  useEffect(() => {
    if (editingProfile && editingProfileId) {
      form.reset({
        name: editingProfile.name,
        bankName: editingProfile.bankName,
        bankAccountNumber: editingProfile.bankAccountNumber,
        fullName: editingProfile.fullName,
        walletNumber: editingProfile.walletNumber,
        methodId: editingProfile.methodId,
        status: editingProfile.status,
      });
    }
  }, [editingProfile, editingProfileId, form]);

  const onSubmit = async (data: PayoutProfileFormData) => {
    try {
      if (editingProfileId) {
        await updateMutation.mutateAsync({
          payoutProfileId: editingProfileId,
          data,
        });
        toast.success('Payout profile updated successfully');
        setEditingProfileId(null);
        form.reset();
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Payout profile created successfully');
        setIsCreateModalOpen(false);
        form.reset();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save payout profile';
      toast.error('Operation Failed', {
        description: errorMessage,
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingProfileId) return;
    try {
      await deleteMutation.mutateAsync(deletingProfileId);
      toast.success('Payout profile deleted successfully');
      setDeletingProfileId(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete payout profile';
      toast.error('Deletion Failed', {
        description: errorMessage,
      });
    }
  };

  const handleRequestPayout = async () => {
    if (!requestingPayout) return;
    try {
      await requestPayoutMutation.mutateAsync({
        profileId: requestingPayout.profileId,
        bookIds: requestingPayout.bookIds,
      });
      toast.success('Payout requested successfully');
      setRequestingPayout(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to request payout';
      toast.error('Request Failed', {
        description: errorMessage,
      });
    }
  };

  const getMethodType = (profile: { bankName: string | null; walletNumber: string | null }) => {
    if (profile.bankName) return 'Bank Account';
    if (profile.walletNumber) return 'Mobile Wallet';
    return 'Unknown';
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Payout Profiles</h1>
            <p className='text-muted-foreground'>Manage your payout profiles</p>
          </div>
        </div>
        <div className='rounded-md border p-4'>
          <TableSkeleton rows={5} columns={7} />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Payout Profiles</h1>
          <p className='text-muted-foreground'>Manage your payout profiles</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Add Profile
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Account/Wallet</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payoutProfiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-8 text-muted-foreground'>
                  No payout profiles found. Create your first profile to get started.
                </TableCell>
              </TableRow>
            ) : (
              payoutProfiles.map(profile => (
                <TableRow key={profile.id}>
                  <TableCell className='font-medium'>{profile.id}</TableCell>
                  <TableCell>{profile.name}</TableCell>
                  <TableCell>
                    <Badge variant='outline'>{getMethodType(profile)}</Badge>
                  </TableCell>
                  <TableCell>{profile.fullName}</TableCell>
                  <TableCell>
                    {profile.bankAccountNumber || profile.walletNumber || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={profile.status === 1 ? 'default' : 'secondary'}>
                      {profile.status === 1 ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setViewingProfileId(profile.id)}
                      >
                        <Eye className='mr-2 h-4 w-4' />
                        View
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setEditingProfileId(profile.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          setRequestingPayout({ profileId: profile.id, bookIds: [] })
                        }
                      >
                        <Wallet className='mr-2 h-4 w-4' />
                        Request
                      </Button>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => setDeletingProfileId(profile.id)}
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || editingProfileId) && (
        <Dialog
          open={isCreateModalOpen || !!editingProfileId}
          onOpenChange={open => {
            if (!open) {
              setIsCreateModalOpen(false);
              setEditingProfileId(null);
              form.reset();
            }
          }}
        >
          <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>
                {editingProfileId ? 'Edit Payout Profile' : 'Create Payout Profile'}
              </DialogTitle>
              <DialogDescription>
                {editingProfileId
                  ? 'Update payout profile information'
                  : 'Add a new payout profile for receiving payments'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Name *</FormLabel>
                      <FormControl>
                        <Input placeholder='Main Bank Account' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='fullName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder='John Doe' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='methodId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Method ID *</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='1'
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>1 = Bank, 2 = Mobile Wallet</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='status'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min={0}
                            max={1}
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>0 = Inactive, 1 = Active</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='bankName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='National Bank'
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormDescription>Required for bank account method</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='bankAccountNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='1234567890'
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormDescription>Required for bank account method</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='walletNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='01234567890'
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormDescription>Required for mobile wallet method</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setEditingProfileId(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Saving...'
                      : editingProfileId
                      ? 'Update'
                      : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* View Modal */}
      {viewingProfile && (
        <Dialog open={!!viewingProfileId} onOpenChange={() => setViewingProfileId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{viewingProfile.name}</DialogTitle>
              <DialogDescription>Payout profile details</DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-muted-foreground'>Full Name</p>
                  <p className='font-semibold'>{viewingProfile.fullName}</p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Type</p>
                  <p className='font-semibold'>{getMethodType(viewingProfile)}</p>
                </div>
                {viewingProfile.bankName && (
                  <div>
                    <p className='text-sm text-muted-foreground'>Bank Name</p>
                    <p className='font-semibold'>{viewingProfile.bankName}</p>
                  </div>
                )}
                {viewingProfile.bankAccountNumber && (
                  <div>
                    <p className='text-sm text-muted-foreground'>Account Number</p>
                    <p className='font-semibold'>{viewingProfile.bankAccountNumber}</p>
                  </div>
                )}
                {viewingProfile.walletNumber && (
                  <div>
                    <p className='text-sm text-muted-foreground'>Wallet Number</p>
                    <p className='font-semibold'>{viewingProfile.walletNumber}</p>
                  </div>
                )}
                <div>
                  <p className='text-sm text-muted-foreground'>Status</p>
                  <Badge variant={viewingProfile.status === 1 ? 'default' : 'secondary'}>
                    {viewingProfile.status === 1 ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Method ID</p>
                  <p className='font-semibold'>{viewingProfile.methodId}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setViewingProfileId(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProfileId && (
        <Dialog open={!!deletingProfileId} onOpenChange={() => setDeletingProfileId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Payout Profile</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this payout profile? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setDeletingProfileId(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant='destructive'
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Request Payout Modal */}
      {requestingPayout && (
        <Dialog open={!!requestingPayout} onOpenChange={() => setRequestingPayout(null)}>
          <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Select bookings to include in this payout request
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div className='max-h-96 overflow-y-auto border rounded-md p-4'>
                {bookings.length === 0 ? (
                  <p className='text-sm text-muted-foreground text-center py-4'>
                    No bookings available
                  </p>
                ) : (
                  <div className='space-y-2'>
                    {bookings.map(booking => (
                      <label
                        key={booking.id}
                        className='flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={requestingPayout.bookIds.includes(booking.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setRequestingPayout({
                                ...requestingPayout,
                                bookIds: [...requestingPayout.bookIds, booking.id],
                              });
                            } else {
                              setRequestingPayout({
                                ...requestingPayout,
                                bookIds: requestingPayout.bookIds.filter(id => id !== booking.id),
                              });
                            }
                          }}
                          className='rounded'
                        />
                        <div className='flex-1'>
                          <p className='text-sm font-medium'>
                            Booking #{booking.id} - {booking.propTitle}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {new Date(booking.checkIn).toLocaleDateString()} -{' '}
                            {new Date(booking.checkOut).toLocaleDateString()} |{' '}
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(booking.total)}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {requestingPayout.bookIds.length > 0 && (
                <p className='text-sm text-muted-foreground'>
                  {requestingPayout.bookIds.length} booking(s) selected
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setRequestingPayout(null)}
                disabled={requestPayoutMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestPayout}
                disabled={
                  requestPayoutMutation.isPending || requestingPayout.bookIds.length === 0
                }
              >
                {requestPayoutMutation.isPending ? 'Requesting...' : 'Request Payout'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}





