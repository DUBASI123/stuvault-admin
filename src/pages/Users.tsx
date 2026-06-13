import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { ShieldCheck, Mail, Phone, Award, Building2, Library, Calendar, Shield, ShieldOff, Search, Users as UsersIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

type FilterStatus = 'ALL' | 'APPROVED' | 'PENDING' | 'BLOCKED' | 'REJECTED';

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-50 text-purple-700 border border-purple-100',
  COLLEGE_ADMIN: 'bg-blue-50 text-blue-700 border border-blue-100',
  DEPARTMENT_ADMIN: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
};

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-100',
  BLOCKED: 'bg-rose-50 text-rose-700 border border-rose-100',
  REJECTED: 'bg-slate-100 text-slate-600 border border-slate-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
};

export default function Users() {
  const { users, colleges, departments, currentUser, blockUser, unblockUser, approveUser, rejectUser } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (!currentUser) return null;

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => u.id !== currentUser.id) // don't show self
      .filter(u => statusFilter === 'ALL' || u.status === statusFilter)
      .filter(u => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return u.name.toLowerCase().includes(lower) || u.email.toLowerCase().includes(lower) || u.role.toLowerCase().includes(lower);
      });
  }, [users, currentUser, statusFilter, searchTerm]);

  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = { ALL: 0, APPROVED: 0, PENDING: 0, BLOCKED: 0, REJECTED: 0 };
    users.filter(u => u.id !== currentUser.id).forEach(u => {
      counts.ALL++;
      const key = u.status as string;
      if (key in counts) counts[key]++;
    });
    return counts;
  }, [users, currentUser]);

  const handleAction = async (userId: string, action: 'block' | 'unblock' | 'approve' | 'reject') => {
    setActionLoading(userId + action);
    try {
      if (action === 'block') { await blockUser(userId); toast.success('User blocked'); }
      else if (action === 'unblock') { await unblockUser(userId); toast.success('User unblocked'); }
      else if (action === 'approve') { await approveUser(userId); toast.success('User approved'); }
      else { await rejectUser(userId); toast.success('User rejected'); }
    } catch (e: any) {
      toast.error(e.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const FILTERS: { key: FilterStatus; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'BLOCKED', label: 'Blocked' },
    { key: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-display text-slate-800 tracking-tight">
            User Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            View and manage all administrator accounts across the portal
          </p>
        </div>
        {/* Search */}
        <div className="relative rounded-xl shadow-sm max-w-xs w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="focus:ring-2 focus:ring-blue-500 focus:border-transparent block w-full pl-9 text-sm border-slate-200 bg-white rounded-xl py-2 px-3 border outline-none placeholder-slate-400 transition-all"
            placeholder="Search name, email, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              statusFilter === key
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
            <span className={`px-1.5 py-0.5 rounded-lg text-xs font-bold ${statusFilter === key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {countByStatus[key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* User cards */}
      {filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 gap-5">
          {filteredUsers.map((user) => {
            const college = colleges.find(c => c.id === user.collegeId);
            const department = departments.find(d => d.id === user.departmentId);
            const isLoading = actionLoading?.startsWith(user.id);

            return (
              <div key={user.id} className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-500 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                      {user.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-800">{user.name}</h3>
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-700'}`}>
                          {user.role.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[user.status] || 'bg-slate-100 text-slate-700'}`}>
                          {user.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 pt-1">
                        <span className="flex items-center text-sm text-slate-500 gap-1.5 truncate">
                          <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </span>
                        {user.mobile && (
                          <span className="flex items-center text-sm text-slate-500 gap-1.5">
                            <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            {user.mobile}
                          </span>
                        )}
                        {user.designation && (
                          <span className="flex items-center text-sm text-slate-500 gap-1.5">
                            <Award className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            {user.designation}
                          </span>
                        )}
                        {college && (
                          <span className="flex items-center text-sm text-slate-500 gap-1.5">
                            <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            {college.name}
                          </span>
                        )}
                        {department && (
                          <span className="flex items-center text-sm text-slate-500 gap-1.5">
                            <Library className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            {department.name}
                          </span>
                        )}
                        <span className="flex items-center text-sm text-slate-500 gap-1.5">
                          <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-center flex-shrink-0">
                    {user.status === 'PENDING' && (
                      <>
                        <button
                          disabled={!!isLoading}
                          onClick={() => handleAction(user.id, 'approve')}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10 cursor-pointer disabled:opacity-60"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          disabled={!!isLoading}
                          onClick={() => handleAction(user.id, 'reject')}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {(user.status === 'APPROVED' || user.status === 'ACTIVE') && (
                      <button
                        disabled={!!isLoading}
                        onClick={() => handleAction(user.id, 'block')}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl text-rose-700 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-60"
                      >
                        <ShieldOff className="h-4 w-4" />
                        Block User
                      </button>
                    )}
                    {user.status === 'BLOCKED' && (
                      <button
                        disabled={!!isLoading}
                        onClick={() => handleAction(user.id, 'unblock')}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-all cursor-pointer disabled:opacity-60"
                      >
                        <Shield className="h-4 w-4" />
                        Unblock
                      </button>
                    )}
                    {user.status === 'REJECTED' && (
                      <button
                        disabled={!!isLoading}
                        onClick={() => handleAction(user.id, 'approve')}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-all cursor-pointer disabled:opacity-60"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Re-approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
          <UsersIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-lg font-medium text-slate-600">No users found</p>
          <p className="text-sm mt-1">{searchTerm || statusFilter !== 'ALL' ? 'Try adjusting your filters.' : 'No administrator accounts registered yet.'}</p>
        </div>
      )}
    </div>
  );
}
