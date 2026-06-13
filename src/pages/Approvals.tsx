import { useState } from 'react';
import { useStore } from '../lib/store';
import { Check, X, ShieldCheck, Calendar, Phone, Mail, Award, Building2, Library, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function Approvals() {
  const { users, colleges, departments, currentUser, approveUser, rejectUser } = useStore();
  const [assignCollegeId, setAssignCollegeId] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (!currentUser) return null;

  const pendingUsers = users.filter((u) => {
    if (u.status !== 'PENDING') return false;
    if (currentUser.role === 'SUPER_ADMIN') return u.role === 'COLLEGE_ADMIN';
    if (currentUser.role === 'COLLEGE_ADMIN') {
      return u.role === 'DEPARTMENT_ADMIN' && u.collegeId === currentUser.collegeId;
    }
    return false;
  });

  const handleApprove = async (userId: string, userRole: string, userCollegeId?: string) => {
    if (currentUser.role === 'SUPER_ADMIN' && userRole === 'COLLEGE_ADMIN') {
      const selectedCollege = assignCollegeId[userId] || userCollegeId;
      if (!selectedCollege) {
        toast.error('Please assign a college before approving');
        return;
      }
      setActionLoading(userId + 'approve');
      try {
        await approveUser(userId, selectedCollege);
        toast.success('College Admin approved and assigned to college');
      } catch (e) {
        toast.error('Failed to approve user');
      } finally {
        setActionLoading(null);
      }
      return;
    }
    setActionLoading(userId + 'approve');
    try {
      await approveUser(userId);
      toast.success('User approved successfully');
    } catch (e) {
      toast.error('Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id + 'reject');
    try {
      await rejectUser(id);
      toast.success('User rejected successfully');
    } catch (e) {
      toast.error('Failed to reject user');
    } finally {
      setActionLoading(null);
    }
  };

  // Stats
  const recentlyApproved = users.filter(u =>
    u.status === 'APPROVED' || u.status === 'ACTIVE'
  ).length;
  const totalRejected = users.filter(u => u.status === 'REJECTED').length;

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-display text-slate-800 tracking-tight">
            Pending Approvals
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review and approve registration requests for administrator accounts
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl text-sm font-semibold text-amber-700 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending: <span className="font-bold">{pendingUsers.length}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-sm font-semibold text-emerald-700 flex items-center gap-2">
            <Check className="h-4 w-4" />
            Approved: <span className="font-bold">{recentlyApproved}</span>
          </div>
          <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl text-sm font-semibold text-rose-700 flex items-center gap-2">
            <X className="h-4 w-4" />
            Rejected: <span className="font-bold">{totalRejected}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {pendingUsers.length > 0 ? (
          pendingUsers.map((user) => {
            const isApproving = actionLoading === user.id + 'approve';
            const isRejecting = actionLoading === user.id + 'reject';
            const busy = isApproving || isRejecting;
            const needsCollegeAssignment = currentUser.role === 'SUPER_ADMIN' && user.role === 'COLLEGE_ADMIN';
            const selectedCollege = assignCollegeId[user.id] || user.collegeId || '';
            const assignedCollege = colleges.find(c => c.id === (user.collegeId || selectedCollege));
            const assignedDept = departments.find(d => d.id === user.departmentId);
            const assignedCollegeForDept = assignedDept ? colleges.find(c => c.id === user.collegeId) : null;

            return (
              <div key={user.id} className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300">
                {/* Colored top accent */}
                <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                        {user.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                      </div>
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-slate-800">{user.name}</h3>
                          <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {user.role.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                          <span className="flex items-center text-sm text-slate-500 gap-1.5">
                            <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </span>
                          <span className="flex items-center text-sm text-slate-500 gap-1.5">
                            <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            {user.mobile || 'N/A'}
                          </span>
                          {user.designation && (
                            <span className="flex items-center text-sm text-slate-500 gap-1.5">
                              <Award className="h-4 w-4 text-slate-400 flex-shrink-0" />
                              {user.designation}
                            </span>
                          )}
                          {user.role === 'DEPARTMENT_ADMIN' && assignedCollegeForDept && (
                            <span className="flex items-center text-sm text-slate-500 gap-1.5">
                              <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                              {assignedCollegeForDept.name}
                            </span>
                          )}
                          {user.role === 'DEPARTMENT_ADMIN' && assignedDept && (
                            <span className="flex items-center text-sm text-slate-500 gap-1.5">
                              <Library className="h-4 w-4 text-slate-400 flex-shrink-0" />
                              {assignedDept.name}
                            </span>
                          )}
                          {user.role === 'COLLEGE_ADMIN' && assignedCollege && !needsCollegeAssignment && (
                            <span className="flex items-center text-sm text-slate-500 gap-1.5">
                              <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                              {assignedCollege.name}
                            </span>
                          )}
                          <span className="flex items-center text-sm text-slate-500 gap-1.5">
                            <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            Requested {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                          </span>
                        </div>

                        {/* College Assignment dropdown for SUPER_ADMIN approving COLLEGE_ADMIN */}
                        {needsCollegeAssignment && (
                          <div className="mt-3 max-w-sm">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                              <Building2 className="h-3.5 w-3.5 inline mr-1 text-amber-500" />
                              Assign College <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={selectedCollege}
                              onChange={e => setAssignCollegeId(prev => ({ ...prev, [user.id]: e.target.value }))}
                              className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm transition-all"
                            >
                              <option value="">-- Select a college --</option>
                              {colleges.filter(c => c.status === 'ACTIVE').map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            {!selectedCollege && (
                              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" />
                                Required before approving
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-end lg:self-start flex-shrink-0">
                      <button
                        onClick={() => handleApprove(user.id, user.role, user.collegeId)}
                        disabled={busy || (needsCollegeAssignment && !(assignCollegeId[user.id] || user.collegeId))}
                        className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-md shadow-emerald-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(user.id)}
                        disabled={busy}
                        className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 border border-slate-200 text-sm font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none transition-all cursor-pointer disabled:opacity-50"
                      >
                        <X className="h-4 w-4 text-slate-500" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center text-slate-400 shadow-sm">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-xl font-bold text-slate-700">All caught up!</p>
            <p className="text-sm mt-1.5 text-slate-500">No pending registration approvals at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
