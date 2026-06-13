import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import {
  Users, Building2, Library, CheckCircle, GraduationCap,
  TrendingUp, AlertTriangle, Star, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

export default function Dashboard() {
  const { currentUser, colleges, departments, students, users } = useStore();

  if (!currentUser) return null;

  const role = currentUser.role;

  // Filtered scopes per role
  const scopedStudents = useMemo(() => {
    if (role === 'COLLEGE_ADMIN') return students.filter(s => s.collegeId === currentUser.collegeId);
    if (role === 'DEPARTMENT_ADMIN') return students.filter(s => s.departmentId === currentUser.departmentId);
    return students;
  }, [students, role, currentUser]);

  const scopedDepts = useMemo(() => {
    if (role === 'COLLEGE_ADMIN') return departments.filter(d => d.collegeId === currentUser.collegeId);
    if (role === 'DEPARTMENT_ADMIN') return departments.filter(d => d.id === currentUser.departmentId);
    return departments;
  }, [departments, role, currentUser]);

  // Computed stats
  const activeStudents = scopedStudents.filter(s => s.status === 'ACTIVE').length;
  const graduatedStudents = scopedStudents.filter(s => s.status === 'GRADUATED').length;
  const dropoutStudents = scopedStudents.filter(s => s.status === 'DROPOUT').length;
  const avgCGPA = scopedStudents.length > 0
    ? (scopedStudents.reduce((acc, s) => acc + s.cgpa, 0) / scopedStudents.length).toFixed(2)
    : '—';
  const topStudents = [...scopedStudents].sort((a, b) => b.cgpa - a.cgpa).slice(0, 5);

  // SUPER_ADMIN specific
  const pendingRequests = users.filter(u => u.status === 'PENDING').length;
  const approvedUsers = users.filter(u => u.status === 'APPROVED' || u.status === 'ACTIVE').length;

  // COLLEGE_ADMIN specific
  const pendingDeptAdmins = users.filter(u =>
    u.status === 'PENDING' && u.role === 'DEPARTMENT_ADMIN' && u.collegeId === currentUser.collegeId
  ).length;

  // Stats grid per role
  const stats = useMemo(() => {
    if (role === 'SUPER_ADMIN') {
      return [
        { name: 'Total Colleges', value: colleges.length, icon: Building2, color: 'from-blue-500 to-cyan-500 shadow-blue-500/20', link: '/colleges' },
        { name: 'Total Departments', value: departments.length, icon: Library, color: 'from-indigo-500 to-violet-500 shadow-indigo-500/20', link: '/departments' },
        { name: 'Total Students', value: students.length, icon: Users, color: 'from-purple-500 to-pink-500 shadow-purple-500/20', link: '/students' },
        { name: 'Pending Approvals', value: pendingRequests, icon: CheckCircle, color: pendingRequests > 0 ? 'from-amber-500 to-orange-500 shadow-amber-500/20' : 'from-emerald-500 to-teal-500 shadow-emerald-500/20', link: '/approvals' },
      ];
    }
    if (role === 'COLLEGE_ADMIN') {
      return [
        { name: 'Departments', value: scopedDepts.length, icon: Library, color: 'from-indigo-500 to-violet-500 shadow-indigo-500/20', link: '/departments' },
        { name: 'Total Students', value: scopedStudents.length, icon: Users, color: 'from-purple-500 to-pink-500 shadow-purple-500/20', link: '/students' },
        { name: 'Active Students', value: activeStudents, icon: GraduationCap, color: 'from-emerald-500 to-teal-500 shadow-emerald-500/20', link: '/students' },
        { name: 'Pending Admins', value: pendingDeptAdmins, icon: CheckCircle, color: pendingDeptAdmins > 0 ? 'from-amber-500 to-orange-500 shadow-amber-500/20' : 'from-slate-400 to-slate-500 shadow-slate-400/20', link: '/approvals' },
      ];
    }
    // DEPARTMENT_ADMIN
    return [
      { name: 'My Students', value: scopedStudents.length, icon: Users, color: 'from-blue-500 to-cyan-500 shadow-blue-500/20', link: '/students' },
      { name: 'Active', value: activeStudents, icon: GraduationCap, color: 'from-emerald-500 to-teal-500 shadow-emerald-500/20', link: '/students' },
      { name: 'Graduated', value: graduatedStudents, icon: Star, color: 'from-indigo-500 to-violet-500 shadow-indigo-500/20', link: '/students' },
      { name: 'Dropout', value: dropoutStudents, icon: AlertTriangle, color: 'from-rose-500 to-pink-500 shadow-rose-500/20', link: '/students' },
    ];
  }, [role, colleges, departments, students, scopedDepts, scopedStudents, activeStudents, graduatedStudents, dropoutStudents, pendingRequests, pendingDeptAdmins]);

  // Pie chart data
  const pieData = [
    { name: 'Active', value: activeStudents },
    { name: 'Graduated', value: graduatedStudents },
    { name: 'Dropout', value: dropoutStudents },
  ].filter(d => d.value > 0);

  // Bar chart data for Super Admin (students per college)
  const barData = colleges.map(c => ({
    name: c.code,
    students: students.filter(s => s.collegeId === c.id).length,
    depts: departments.filter(d => d.collegeId === c.id).length,
  }));

  // Semester distribution for dept admin
  const semesterData = Array.from({ length: 8 }, (_, i) => ({
    name: `Sem ${i + 1}`,
    students: scopedStudents.filter(s => s.semester === i + 1).length,
  }));

  // CGPA range distribution
  const cgpaData = [
    { range: '9-10', count: scopedStudents.filter(s => s.cgpa >= 9).length },
    { range: '8-9', count: scopedStudents.filter(s => s.cgpa >= 8 && s.cgpa < 9).length },
    { range: '7-8', count: scopedStudents.filter(s => s.cgpa >= 7 && s.cgpa < 8).length },
    { range: '6-7', count: scopedStudents.filter(s => s.cgpa >= 6 && s.cgpa < 7).length },
    { range: '<6', count: scopedStudents.filter(s => s.cgpa < 6).length },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold font-display text-white tracking-tight">
              Welcome back, {currentUser.name.split(' ')[0]}! 👋
            </h2>
            <p className="text-slate-300 mt-1 max-w-xl">
              You are logged in as{' '}
              <span className="font-semibold text-blue-400">{currentUser.role.replace(/_/g, ' ')}</span>.
              Here is your operational overview.
            </p>
          </div>
          {role === 'SUPER_ADMIN' && (
            <div className="flex flex-col items-end gap-1.5">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">System Health</div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-md shadow-emerald-400/50" />
                <span className="text-sm font-semibold text-emerald-400">{approvedUsers} active admins</span>
              </div>
              {pendingRequests > 0 && (
                <Link to="/approvals" className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {pendingRequests} pending approval{pendingRequests > 1 ? 's' : ''}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <Link
            key={item.name}
            to={item.link}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-100 dark:border-slate-800 hover:border-slate-200/80 dark:hover:border-slate-700/80 p-6 rounded-2xl shadow-sm hover:shadow-lg hover-lift transition-all duration-300 flex items-center gap-5 group"
          >
            <div className={`p-4 rounded-2xl bg-gradient-to-tr ${item.color} text-white shadow-md flex-shrink-0`}>
              <item.icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{item.name}</p>
              <h4 className="text-3xl font-bold font-display text-slate-800 dark:text-slate-100 mt-1">{item.value}</h4>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </Link>
        ))}
      </div>
 
      {/* CGPA & Student summary strip */}
      {scopedStudents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover-lift">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg CGPA</p>
            <p className="text-4xl font-extrabold font-display text-blue-600 dark:text-blue-400 mt-2">{avgCGPA}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">across {scopedStudents.length} students</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover-lift">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Rate</p>
            <p className="text-4xl font-extrabold font-display text-emerald-600 dark:text-emerald-400 mt-2">
              {scopedStudents.length > 0 ? ((activeStudents / scopedStudents.length) * 100).toFixed(0) : 0}%
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{activeStudents} active / {scopedStudents.length} total</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover-lift">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Top CGPA</p>
            <p className="text-4xl font-extrabold font-display text-purple-600 dark:text-purple-400 mt-2">
              {topStudents[0]?.cgpa.toFixed(2) ?? '—'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{topStudents[0]?.name ?? 'No students yet'}</p>
          </div>
        </div>
      )}
 
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Student Status Pie */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl p-6 hover:shadow-md transition-all">
          <h3 className="text-lg font-bold font-display text-slate-800 dark:text-slate-100 mb-6">Student Status Distribution</h3>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <GraduationCap className="h-10 w-10 text-slate-300" />
                <p className="text-sm">No student data available</p>
              </div>
            )}
          </div>
        </div>

        {/* CGPA Distribution for all roles */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl p-6 hover:shadow-md transition-all">
          <h3 className="text-lg font-bold font-display text-slate-800 dark:text-slate-100 mb-6">CGPA Distribution</h3>
          <div className="h-64">
            {scopedStudents.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cgpaData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="range" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                  <Bar dataKey="count" name="Students" fill="#6366F1" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
                <TrendingUp className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="text-sm">No CGPA data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Super Admin: colleges overview bar chart */}
        {role === 'SUPER_ADMIN' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl p-6 hover:shadow-md transition-all">
            <h3 className="text-lg font-bold font-display text-slate-800 dark:text-slate-100 mb-6">Colleges Overview</h3>
            <div className="h-64">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                    <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10B981" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                    <Bar yAxisId="left" dataKey="students" fill="#3B82F6" name="Students" radius={[6, 6, 0, 0]} barSize={16} />
                    <Bar yAxisId="right" dataKey="depts" fill="#10B981" name="Depts" radius={[6, 6, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">No data</div>
              )}
            </div>
          </div>
        )}

        {/* Dept/College Admin: semester distribution */}
        {(role === 'DEPARTMENT_ADMIN' || role === 'COLLEGE_ADMIN') && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl p-6 hover:shadow-md transition-all">
            <h3 className="text-lg font-bold font-display text-slate-800 dark:text-slate-100 mb-6">Students by Semester</h3>
            <div className="h-64">
              {scopedStudents.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={semesterData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="semGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                    <Area type="monotone" dataKey="students" stroke="#6366F1" strokeWidth={2.5} fill="url(#semGradient)" name="Students" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">No data</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Top Students table */}
      {topStudents.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold font-display text-slate-800 dark:text-slate-100">Top Performers</h3>
            <Link to="/students" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50/75 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hall Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sem</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CGPA</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                {topStudents.map((s, idx) => {
                  const dept = departments.find(d => d.id === s.departmentId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-3 text-sm font-bold text-slate-400 dark:text-slate-500">#{idx + 1}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs flex-shrink-0">
                            {s.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{s.name}</div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-slate-500 dark:text-slate-400">{s.hallTicket}</td>
                      <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400 truncate max-w-[160px]">{dept?.name || '—'}</td>
                      <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-xs font-semibold dark:text-slate-300">{s.semester}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`font-bold px-2.5 py-0.5 rounded-lg text-xs border ${
                          s.cgpa >= 9 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          s.cgpa >= 7 ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {s.cgpa.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
