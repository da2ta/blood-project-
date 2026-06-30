import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHospitalProfile, updateHospitalProfile } from '../../api/hospital.api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { toast } from 'react-toastify';
import { Building2, MapPin, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

export function HospitalProfilePage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['hospital-profile'],
    queryFn: getHospitalProfile,
  });

  const mutation = useMutation({
    mutationFn: updateHospitalProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutation.mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      pincode: formData.get('pincode') as string,
      website: formData.get('website') as string,
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="p-8 text-center text-red-500">Failed to load profile.</div>;
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hospital Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your hospital's public information and contact details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Status Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Status</h3>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium mt-1 ${
                  profile.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {profile.status === 'APPROVED' && <ShieldCheck className="w-3.5 h-3.5" />}
                  {profile.status}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Registration Number</label>
                <div className="mt-1 text-sm font-mono text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  {profile.registrationNumber}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Hospital Type</label>
                <div className="mt-1 text-sm text-slate-900">
                  {profile.type}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Joined On</label>
                <div className="mt-1 text-sm text-slate-900">
                  {profile.createdAt ? format(new Date(profile.createdAt), 'MMMM dd, yyyy') : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Editable Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <h2 className="font-semibold text-slate-900">General Information</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Hospital Name" name="name" defaultValue={profile.name} required />
                <Input label="Email Address" name="email" type="email" defaultValue={profile.email} required />
                <Input label="Phone Number" name="phone" defaultValue={profile.phone} required />
                <Input label="Website (Optional)" name="website" type="url" defaultValue={profile.website} />
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-medium text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" /> Location Details
                </h3>
                <div className="space-y-6">
                  <Input label="Street Address" name="address" defaultValue={profile.address} required />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label="City" name="city" defaultValue={profile.city} required />
                    <Input label="State" name="state" defaultValue={profile.state} required />
                    <Input label="PIN Code" name="pincode" defaultValue={profile.pincode} required />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <Button type="submit" isLoading={mutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
