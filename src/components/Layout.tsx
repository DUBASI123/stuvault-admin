import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { 
  LayoutDashboard, 
  Building2, 
  Library, 
  Users, 
  CheckSquare,
  LogOut,
  Bell,
  Menu,
  X,
  ShieldCheck,
  UserCog,
  UserCircle,
  FileText,
  BarChart2
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { formatDistanceToNow } from 'date-fns';

export default function Layout() {
  const { currentUser, logout, notifications, markNotificationRead, markAllNotificationsRead } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const userNotifications = notifications.filter(n => n.userId === currentUser.id);
  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPARTMENT_ADMIN'] },
    { name: 'Colleges', path: '/colleges', icon: Building2, roles: ['SUPER_ADMIN'] },
    { name: 'Departments', path: '/departments', icon: Library, roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'] },
    { name: 'Students', path: '/students', icon: Users, roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPARTMENT_ADMIN'] },
    { name: 'Approvals', path: '/approvals', icon: CheckSquare, roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'] },
    { name: 'Users', path: '/users', icon: UserCog, roles: ['SUPER_ADMIN'] },
    { name: 'Activity Log', path: '/logs', icon: FileText, roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'] },
    { name: 'Reports', path: '/reports', icon: BarChart2, roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPARTMENT_ADMIN'] },
    { name: 'Profile', path: '/profile', icon: UserCircle, roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPARTMENT_ADMIN'] },
  ];

  const allowedNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 font-sans">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-950 border-r border-white/10">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-6">
              <ShieldCheck className="h-8 w-8 text-blue-500" />
              <span className="ml-2.5 text-white text-xl font-bold font-display tracking-tight">StuVault</span>
            </div>
            <nav className="mt-8 px-3 space-y-1.5">
              {allowedNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`${isActive ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'} group flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl border border-transparent transition-all`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'} mr-3 flex-shrink-0 h-5 w-5`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex bg-white/5 p-4 border-t border-white/10">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{currentUser.name}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">{currentUser.role.replace('_', ' ')}</p>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-white cursor-pointer transition-colors p-2 hover:bg-white/5 rounded-xl" title="Logout">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 w-14"></div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-slate-950 to-slate-900 border-r border-slate-800">
            <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-6">
                <ShieldCheck className="h-8 w-8 text-blue-500" />
                <span className="ml-2.5 text-white text-2xl font-bold font-display tracking-tight">StuVault</span>
              </div>
              <nav className="mt-10 flex-1 px-3 space-y-1.5">
                {allowedNavItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`${isActive ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'} group flex items-center px-4 py-2.5 text-sm font-semibold border border-transparent rounded-xl transition-all duration-200`}
                    >
                      <item.icon className={`${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'} mr-3 flex-shrink-0 h-5 w-5`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex bg-white/5 border-t border-white/10 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center justify-between">
                  <Link to="/profile" className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
                    <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {currentUser.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white leading-tight truncate">{currentUser.name}</p>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">{currentUser.role.replace('_', ' ')}</p>
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="text-slate-400 hover:text-white cursor-pointer transition-colors p-2 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 flex-shrink-0" title="Logout">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-slate-100 shadow-sm">
          <button
            className="px-4 border-r border-slate-100 text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden cursor-pointer"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-6 flex justify-between">
            <div className="flex-1 flex items-center">
              <h1 className="text-xl font-bold font-display text-slate-800 hidden sm:block">
                {allowedNavItems.find(item => location.pathname.startsWith(item.path))?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6 relative">
              <button
                className="bg-white p-2 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative cursor-pointer"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>
              <ThemeToggle />

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="origin-top-right absolute right-0 top-12 mt-2 w-80 rounded-2xl shadow-xl py-1 bg-white border border-slate-100 ring-opacity-5 focus:outline-none z-50">
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllNotificationsRead()}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{unreadCount} new</span>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
                    {userNotifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-slate-400 text-center">No new notifications</p>
                    ) : (
                      userNotifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`px-4 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-50/20' : ''}`}
                          onClick={() => {
                            if (!notification.isRead) markNotificationRead(notification.id);
                          }}
                        >
                          <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{notification.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-slate-50 p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

