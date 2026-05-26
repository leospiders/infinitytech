import { useState } from 'react';
import { useEmployees, useApproveEmployee, useUpdateEmployee } from '../../hooks/useApiQueries';
import { useAuthStore } from '../../stores/authStore';
import { RefreshCw, Search, CheckCircle, ShieldAlert, Phone, Mail, Shield } from 'lucide-react';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';

export function UsersView({ showToast }: { showToast: (type: 'success' | 'error', message: string) => void }) {
  const { user: currentUser } = useAuthStore();
  const { data: employees, isLoading, refetch } = useEmployees(false); // get ALL employees, including inactive

  const [search, setSearch] = useState('');
  const [filterPending, setFilterPending] = useState(false);

  const approveMutation = useApproveEmployee();
  const updateMutation = useUpdateEmployee();

  const handleApprove = async (id: number, name: string) => {
    try {
      await approveMutation.mutateAsync(id);
      showToast('success', `User ${name} approved successfully`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to approve user');
    }
  };

  const handleRoleChange = async (id: number, name: string, currentRole: string, newRole: string) => {
    if (newRole === currentRole) return;
    try {
      await updateMutation.mutateAsync({ id, data: { role: newRole } });
      showToast('success', `Updated ${name}'s role to ${newRole}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update role');
    }
  };

  const handleStatusChange = async (id: number, name: string, active: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, data: { is_active: active } });
      showToast('success', `${name} account ${active ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update status');
    }
  };

  // Filter logic
  const filteredEmployees = employees?.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      (emp.phone && emp.phone.includes(search));
    const matchesPending = filterPending ? !emp.is_active : true;
    return matchesSearch && matchesPending;
  });

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'ADMIN':
        return 'bg-brand/10 text-brand border border-brand/20';
      case 'TECHNICIAN':
      default:
        return 'bg-success/10 text-success border border-success/20';
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-deep">User Management</h1>
          <p className="text-xs text-muted dark:text-dim">
            Manage registrations, approve pending accounts, and assign permissions.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="neo-btn py-2 px-4 text-xs font-semibold self-start md:self-auto"
        >
          <RefreshCw className="h-3 w-3 mr-2 animate-pulse" /> Refresh List
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted dark:text-dim">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="neo-input pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterPending(false)}
            className={`neo-btn py-2 px-4 text-xs font-semibold ${!filterPending ? 'neo-toggle-active' : ''}`}
          >
            All Employees
          </button>
          <button
            onClick={() => setFilterPending(true)}
            className={`neo-btn py-2 px-4 text-xs font-semibold ${filterPending ? 'neo-toggle-active' : ''}`}
          >
            Pending Approval ({employees?.filter(e => !e.is_active).length ?? 0})
          </button>
        </div>
      </div>

      {/* Employees Table */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <div className="neo-card p-6 flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D2D6DC] dark:border-[#1F1E2E] text-muted">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees?.map(emp => {
                  const isSelf = emp.id === currentUser?.id;
                  const isTargetSuper = emp.role === 'SUPERADMIN';
                  const isCurrentSuper = currentUser?.role === 'SUPERADMIN';
                  const disableEditing = isTargetSuper && !isCurrentSuper;

                  return (
                    <tr
                      key={emp.id}
                      className="border-b border-[#E5E7EB] dark:border-black/5 hover:bg-black/5 transition-colors"
                    >
                      {/* Name Card */}
                      <td className="py-4 px-4 font-semibold">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand to-brand-secondary flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-brand/10">
                            {emp.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{emp.name} {isSelf && <span className="text-[10px] text-brand ml-1 font-semibold">(You)</span>}</span>
                            <span className="text-[10px] text-muted dark:text-dim">ID: #{emp.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 text-muted dark:text-dim">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-brand" />
                            <span>{emp.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-success" />
                            <span>{emp.phone || 'No phone number'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Dropdown */}
                      <td className="py-4 px-4">
                        {isSelf || disableEditing ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${getRoleBadgeClass(emp.role)}`}>
                            {emp.role}
                          </span>
                        ) : (
                          <select
                            value={emp.role}
                            onChange={e => handleRoleChange(emp.id, emp.name, emp.role, e.target.value)}
                            className="neo-input text-xs py-1 px-2 border-brand/20 bg-transparent min-w-[120px] font-semibold"
                          >
                            {isCurrentSuper && <option value="SUPERADMIN">👑 SUPERADMIN</option>}
                            <option value="ADMIN">🔒 ADMIN</option>
                            <option value="TECHNICIAN">🔧 TECHNICIAN</option>
                          </select>
                        )}
                      </td>

                      {/* Status Badges */}
                      <td className="py-4 px-4">
                        {emp.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-success/10 text-success border border-success/20">
                            <CheckCircle className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-danger/10 text-danger border border-danger/20 animate-pulse">
                            <ShieldAlert className="h-3 w-3" /> Pending Approval
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!emp.is_active && (
                            <button
                              onClick={() => handleApprove(emp.id, emp.name)}
                              className="neo-btn py-1.5 px-3 text-[10px] font-bold text-success border-success/30 hover:bg-success/5"
                              disabled={disableEditing}
                            >
                              Approve
                            </button>
                          )}
                          {!isSelf && (
                            <button
                              onClick={() => handleStatusChange(emp.id, emp.name, !emp.is_active)}
                              className={`neo-btn py-1.5 px-3 text-[10px] font-bold ${
                                emp.is_active
                                  ? 'text-danger border-danger/30 hover:bg-danger/5'
                                  : 'text-brand border-brand/30 hover:bg-brand/5'
                              }`}
                              disabled={disableEditing}
                            >
                              {emp.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!filteredEmployees?.length && (
            <div className="text-center py-12 text-muted dark:text-dim flex flex-col items-center gap-2">
              <Shield className="h-10 w-10 text-brand/30" />
              <span>No employees found matching the filter criteria.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
