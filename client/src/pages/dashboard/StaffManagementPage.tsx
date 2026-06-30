import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../../api/staff.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'react-toastify';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function StaffManagementPage() {
  const [search, setSearch] = useState('');
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: staffApi.getStaff,
  });

  const inviteMutation = useMutation({
    mutationFn: staffApi.createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff invited successfully');
      setInviteModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to invite staff');
    },
  });

  const handleInvite = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    inviteMutation.mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
      department: formData.get('department') as string,
    });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' }) =>
      staffApi.updateStaffStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff status updated');
    },
  });

  const filteredStaff = staff.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage hospital administrators and blood bank staff.</p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Invite Staff
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search staff by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading staff...</td></tr>
            ) : filteredStaff.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No staff found.</td></tr>
            ) : (
              filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{member.name}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{member.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                      {member.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {member.department || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                      member.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                      member.status === 'INACTIVE' ? 'bg-slate-100 text-slate-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {member.id !== user?.id && (
                      <div className="flex items-center justify-end gap-2">
                        {member.status === 'ACTIVE' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => statusMutation.mutate({ id: member.id, status: 'SUSPENDED' })}
                            className="text-amber-600 hover:bg-amber-50 hover:border-amber-200"
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => statusMutation.mutate({ id: member.id, status: 'ACTIVE' })}
                            className="text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200"
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite New Staff"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input label="Full Name" name="name" required placeholder="Dr. Sarah Smith" />
          <Input label="Email Address" name="email" type="email" required placeholder="sarah@hospital.com" />
          <Select
            label="Role"
            name="role"
            required
            options={[
              { label: 'Blood Bank Staff', value: 'BLOOD_BANK_STAFF' },
              { label: 'Hospital Admin', value: 'HOSPITAL_ADMIN' }
            ]}
          />
          <Input label="Department (Optional)" name="department" placeholder="e.g. Blood Bank, ICU" />
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={inviteMutation.isPending}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
