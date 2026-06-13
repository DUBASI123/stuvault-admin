import { useState, useMemo } from 'react';
import { useStore } from '../lib/store';
import { Search, FileText, Download } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Logs() {
  const { auditLogs, currentUser } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  // Filter logs based on user role and filters
  const visibleLogs = useMemo(() => {
    if (!currentUser) return [];

    let logs = auditLogs;

    // Filter by search term
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      logs = logs.filter(log =>
        log.userName.toLowerCase().includes(lower) ||
        log.userEmail.toLowerCase().includes(lower) ||
        log.action.toLowerCase().includes(lower) ||
        log.details.toLowerCase().includes(lower)
      );
    }

    // Filter by action type
    if (actionFilter !== 'ALL') {
      logs = logs.filter(log => log.action === actionFilter);
    }

    return logs;
  }, [auditLogs, searchTerm, actionFilter, currentUser]);

  // Unique list of actions for the filter select
  const uniqueActions = useMemo(() => {
    const actions = new Set<string>();
    auditLogs.forEach(log => actions.add(log.action));
    return Array.from(actions);
  }, [auditLogs]);

  // Get color styles for the action badges
  const getActionBadgeStyle = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'APPROVE_USER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'REJECT_USER':
      case 'BLOCK_USER':
      case 'DELETE_COLLEGE':
      case 'DELETE_DEPARTMENT':
      case 'DELETE_STUDENT':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'CHANGE_PASSWORD':
      case 'UPDATE_PROFILE':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'UNBLOCK_USER':
        return 'bg-teal-50 text-teal-700 border-teal-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const handleExportCSV = () => {
    if (visibleLogs.length === 0) {
      toast.error('No logs available to export');
      return;
    }

    const headers = ['ID', 'Timestamp', 'User Name', 'User Email', 'Action', 'Details'];
    const rows = visibleLogs.map(log => [
      log.id,
      format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      log.userName,
      log.userEmail,
      log.action,
      log.details.replace(/"/g, '""')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stuvault_audit_logs_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit logs exported successfully');
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-display text-slate-800 tracking-tight">
            Activity Log
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            System audit trail, security events, and administrative actions log
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center px-4 py-2.5 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all cursor-pointer whitespace-nowrap gap-1.5"
        >
          <Download className="h-4 w-4 text-slate-500" />
          Export to CSV
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative rounded-xl shadow-sm w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="focus:ring-2 focus:ring-blue-500 focus:border-transparent block w-full pl-9 text-sm border-slate-200 bg-white rounded-xl py-2 px-3 border outline-none placeholder-slate-400 transition-all"
            placeholder="Search activity log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter select */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Filter Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="block w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm bg-white"
          >
            <option value="ALL">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>
      </div>

      {visibleLogs.length > 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/75">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {visibleLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}</span>
                        <span className="text-xs text-slate-400 mt-0.5">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs flex-shrink-0">
                          {log.userName.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{log.userName}</div>
                          <div className="text-xs text-slate-400">{log.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getActionBadgeStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-lg font-medium text-slate-600">No activity logs found</p>
          <p className="text-sm mt-1">{searchTerm || actionFilter !== 'ALL' ? 'Adjust your search filters' : 'Actions you take will be logged here'}</p>
        </div>
      )}
    </div>
  );
}
