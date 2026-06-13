import { create } from 'zustand';
import { supabase } from './supabase';

export type Role = 'SUPER_ADMIN' | 'COLLEGE_ADMIN' | 'DEPARTMENT_ADMIN';
export type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'BLOCKED' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  collegeId?: string;
  departmentId?: string;
  mobile?: string;
  designation?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface College {
  id: string;
  name: string;
  code: string;
  address: string;
  status: Status;
  logoUrl?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  collegeId: string;
  name: string;
  code: string;
  adminId?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  collegeId: string;
  departmentId: string;
  hallTicket: string;
  name: string;
  email: string;
  phone: string;
  semester: number;
  cgpa: number;
  status: 'ACTIVE' | 'GRADUATED' | 'DROPOUT';
  photoUrl?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

interface DatabaseState {
  users: User[];
  colleges: College[];
  departments: Department[];
  students: Student[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  currentUser: User | null;
  loading: boolean;
  
  initialize: () => void;
  fetchData: () => Promise<void>;
  fetchPublicData: () => Promise<void>;
  
  login: (email: string, password?: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (user: Omit<User, 'id' | 'createdAt'>, password?: string) => Promise<void>;
  updateProfile: (data: { name: string; mobile?: string; designation?: string; avatarUrl?: string }) => Promise<void>;
  
  approveUser: (userId: string, collegeId?: string, departmentId?: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  addAuditLog: (action: string, details: string) => Promise<void>;

  addCollege: (college: Omit<College, 'id' | 'createdAt'>) => Promise<void>;
  updateCollege: (id: string, data: Partial<Omit<College, 'id' | 'createdAt'>>) => Promise<void>;
  deleteCollege: (id: string) => Promise<void>;

  addDepartment: (department: Omit<Department, 'id' | 'createdAt'>) => Promise<void>;
  updateDepartment: (id: string, data: Partial<Omit<Department, 'id' | 'createdAt'>>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;

  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  updateStudent: (id: string, data: Partial<Omit<Student, 'id' | 'createdAt'>>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
}

const mapProfile = (dbProfile: any): User => ({
  id: dbProfile.id,
  name: dbProfile.name,
  email: dbProfile.email,
  role: dbProfile.role,
  status: dbProfile.status,
  collegeId: dbProfile.college_id,
  departmentId: dbProfile.department_id,
  mobile: dbProfile.mobile,
  designation: dbProfile.designation,
  avatarUrl: dbProfile.avatar_url,
  createdAt: dbProfile.created_at,
});

const mapCollege = (dbCollege: any): College => ({
  id: dbCollege.id,
  name: dbCollege.name,
  code: dbCollege.code,
  address: dbCollege.address,
  status: dbCollege.status,
  logoUrl: dbCollege.logo_url,
  createdAt: dbCollege.created_at,
});

const mapDepartment = (dbDept: any): Department => ({
  id: dbDept.id,
  collegeId: dbDept.college_id,
  name: dbDept.name,
  code: dbDept.code,
  adminId: dbDept.admin_id,
  createdAt: dbDept.created_at,
});

const mapStudent = (dbStudent: any): Student => ({
  id: dbStudent.id,
  collegeId: dbStudent.college_id,
  departmentId: dbStudent.department_id,
  hallTicket: dbStudent.hall_ticket,
  name: dbStudent.name,
  email: dbStudent.email,
  phone: dbStudent.phone,
  semester: Number(dbStudent.semester),
  cgpa: Number(dbStudent.cgpa),
  status: dbStudent.status,
  photoUrl: dbStudent.photo_url,
  createdAt: dbStudent.created_at,
});

const mapNotification = (dbNotif: any): Notification => ({
  id: dbNotif.id,
  userId: dbNotif.user_id,
  title: dbNotif.title,
  message: dbNotif.message,
  type: dbNotif.type,
  isRead: dbNotif.is_read,
  createdAt: dbNotif.created_at,
});

// --- MOCK MODE CONFIGURATION AND DEMO SEED DATA ---
const isMockMode = !import.meta.env.VITE_SUPABASE_URL || 
                   import.meta.env.VITE_SUPABASE_URL === 'your_supabase_url' || 
                   import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
};

const setLocalStorage = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const DEFAULT_COLLEGES: College[] = [
  {
    id: 'a37e1a3a-1b1a-4d92-b430-686940fb17df',
    name: 'Stanford University',
    code: 'STAN',
    address: '450 Serra Mall, Stanford, CA 94305',
    status: 'ACTIVE',
    logoUrl: 'https://res.cloudinary.com/dtdb4irno/image/upload/v1700000000/stanford_logo.jpg',
    createdAt: new Date().toISOString()
  },
  {
    id: 'b58f2b4b-2c2b-4e93-c541-797051fc28e0',
    name: 'Massachusetts Institute of Technology',
    code: 'MIT',
    address: '77 Massachusetts Ave, Cambridge, MA 02139',
    status: 'ACTIVE',
    logoUrl: 'https://res.cloudinary.com/dtdb4irno/image/upload/v1700000000/mit_logo.jpg',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_DEPARTMENTS: Department[] = [
  {
    id: 'c69a3c6c-3d3c-4f94-d652-898162fd39f1',
    collegeId: 'a37e1a3a-1b1a-4d92-b430-686940fb17df',
    name: 'Computer Science & Engineering',
    code: 'CSE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'd70b4d7d-4e4d-5f95-e763-909273fe40f2',
    collegeId: 'a37e1a3a-1b1a-4d92-b430-686940fb17df',
    name: 'Electrical Engineering',
    code: 'EE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'e81c5e8e-5f5e-6f96-f874-910384ff51f3',
    collegeId: 'b58f2b4b-2c2b-4e93-c541-797051fc28e0',
    name: 'Physics',
    code: 'PHYS',
    createdAt: new Date().toISOString()
  },
  {
    id: 'f92d6f9f-6f6f-7f97-0985-021495ff62f4',
    collegeId: 'b58f2b4b-2c2b-4e93-c541-797051fc28e0',
    name: 'Mechanical Engineering',
    code: 'MECH',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_USERS: User[] = [
  {
    id: 'super-admin-id-12345',
    name: 'Super Admin',
    email: 'superadmin@stuvault.com',
    role: 'SUPER_ADMIN',
    status: 'APPROVED',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_STUDENTS: Student[] = [
  {
    id: 'student-id-1',
    collegeId: 'a37e1a3a-1b1a-4d92-b430-686940fb17df',
    departmentId: 'c69a3c6c-3d3c-4f94-d652-898162fd39f1',
    hallTicket: '19STAN001',
    name: 'Alice Johnson',
    email: 'alice.j@stanford.edu',
    phone: '1234567890',
    semester: 6,
    cgpa: 9.82,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'student-id-2',
    collegeId: 'a37e1a3a-1b1a-4d92-b430-686940fb17df',
    departmentId: 'c69a3c6c-3d3c-4f94-d652-898162fd39f1',
    hallTicket: '19STAN002',
    name: 'Bob Smith',
    email: 'bob.s@stanford.edu',
    phone: '2345678901',
    semester: 6,
    cgpa: 8.45,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'student-id-3',
    collegeId: 'a37e1a3a-1b1a-4d92-b430-686940fb17df',
    departmentId: 'd70b4d7d-4e4d-5f95-e763-909273fe40f2',
    hallTicket: '19STAN015',
    name: 'Charlie Brown',
    email: 'charlie.b@stanford.edu',
    phone: '3456789012',
    semester: 4,
    cgpa: 7.89,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'student-id-4',
    collegeId: 'b58f2b4b-2c2b-4e93-c541-797051fc28e0',
    departmentId: 'e81c5e8e-5f5e-6f96-f874-910384ff51f3',
    hallTicket: '19MIT051',
    name: 'David Miller',
    email: 'david.m@mit.edu',
    phone: '4567890123',
    semester: 8,
    cgpa: 9.50,
    status: 'GRADUATED',
    createdAt: new Date().toISOString()
  },
  {
    id: 'student-id-5',
    collegeId: 'b58f2b4b-2c2b-4e93-c541-797051fc28e0',
    departmentId: 'f92d6f9f-6f6f-7f97-0985-021495ff62f4',
    hallTicket: '19MIT102',
    name: 'Eva Watson',
    email: 'eva.w@mit.edu',
    phone: '5678901234',
    semester: 6,
    cgpa: 6.75,
    status: 'DROPOUT',
    createdAt: new Date().toISOString()
  }
];

export const useStore = create<DatabaseState>()((set, get) => ({
  users: [],
  colleges: [],
  departments: [],
  students: [],
  notifications: [],
  auditLogs: [],
  currentUser: null,
  loading: false,

  initialize: () => {
    if (isMockMode) {
      const user = getLocalStorage<User | null>('stuvault_mock_current_user', null);
      set({ currentUser: user });
      get().fetchPublicData();
      if (user) {
        get().fetchData();
      }
      return;
    }
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile && !error) {
          const mappedUser = mapProfile(profile);
          if (mappedUser.status === 'PENDING' || mappedUser.status === 'REJECTED' || mappedUser.status === 'BLOCKED') {
            await supabase.auth.signOut();
            set({ currentUser: null, users: [], students: [], notifications: [] });
            await get().fetchPublicData();
          } else {
            set({ currentUser: mappedUser });
            await get().fetchData();
          }
        } else {
          await get().fetchPublicData();
        }
      } else {
        set({ currentUser: null, users: [], students: [], notifications: [] });
        await get().fetchPublicData();
      }
    });
  },

  fetchPublicData: async () => {
    set({ loading: true });
    if (isMockMode) {
      const colleges = getLocalStorage<College[]>('stuvault_mock_colleges', DEFAULT_COLLEGES);
      const departments = getLocalStorage<Department[]>('stuvault_mock_departments', DEFAULT_DEPARTMENTS);
      set({ colleges, departments, loading: false });
      return;
    }
    try {
      const [collegesRes, deptsRes] = await Promise.all([
        supabase.from('colleges').select('*'),
        supabase.from('departments').select('*')
      ]);
      
      set({
        colleges: (collegesRes.data || []).map(mapCollege),
        departments: (deptsRes.data || []).map(mapDepartment)
      });
    } catch (error) {
      console.error('Error fetching public data:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  fetchData: async () => {
    set({ loading: true });
    if (isMockMode) {
      const colleges = getLocalStorage<College[]>('stuvault_mock_colleges', DEFAULT_COLLEGES);
      const departments = getLocalStorage<Department[]>('stuvault_mock_departments', DEFAULT_DEPARTMENTS);
      const students = getLocalStorage<Student[]>('stuvault_mock_students', DEFAULT_STUDENTS);
      const users = getLocalStorage<User[]>('stuvault_mock_users', DEFAULT_USERS);
      const allNotifs = getLocalStorage<Notification[]>('stuvault_mock_notifications', []);
      const auditLogs = getLocalStorage<AuditLog[]>('stuvault_mock_logs', []);
      const currentUser = get().currentUser;
      const notifications = currentUser ? allNotifs.filter(n => n.userId === currentUser.id) : [];
      
      set({ colleges, departments, students, users, notifications, auditLogs, loading: false });
      return;
    }
    try {
      const [collegesRes, deptsRes, studentsRes, profilesRes] = await Promise.all([
        supabase.from('colleges').select('*'),
        supabase.from('departments').select('*'),
        supabase.from('students').select('*'),
        supabase.from('profiles').select('*')
      ]);
      
      const currentUser = get().currentUser;
      let notifications: Notification[] = [];
      if (currentUser) {
        const notifRes = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUser.id);
        notifications = (notifRes.data || []).map(mapNotification);
      }
      const auditLogs = getLocalStorage<AuditLog[]>('stuvault_mock_logs', []);
      
      set({
        colleges: (collegesRes.data || []).map(mapCollege),
        departments: (deptsRes.data || []).map(mapDepartment),
        students: (studentsRes.data || []).map(mapStudent),
        users: (profilesRes.data || []).map(mapProfile),
        notifications,
        auditLogs
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    if (!password) throw new Error('Password required');
    if (isMockMode) {
      const users = getLocalStorage<User[]>('stuvault_mock_users', DEFAULT_USERS);
      const user = users.find(u => u.email === email);
      if (!user) {
        throw new Error('User not found. Try superadmin@stuvault.com / admin');
      }
      if (user.status === 'PENDING') throw new Error('Your account is pending approval');
      if (user.status === 'REJECTED') throw new Error('Your account registration was rejected');
      if (user.status === 'BLOCKED') throw new Error('Your account has been blocked');
      
      // Check password — super admin uses 'admin' by default if no password stored
      const passwords = getLocalStorage<Record<string, string>>('stuvault_mock_passwords', {});
      const storedPassword = passwords[user.id];
      if (storedPassword) {
        // User has a stored password — validate it
        if (storedPassword !== password) {
          throw new Error('Incorrect password');
        }
      } else if (user.id === 'super-admin-id-12345') {
        // Super admin has no stored password yet — default is 'admin'
        if (password !== 'admin') {
          throw new Error('Incorrect password. Default Super Admin password is "admin"');
        }
      }
      // Other users with no stored password: allow any password (backward compat)
      
      set({ currentUser: user });
      setLocalStorage('stuvault_mock_current_user', user);
      await get().fetchData();
      await get().addAuditLog('LOGIN', `User ${user.name} logged in`);
      return user;
    }
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Login failed: User not returned');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
      
    if (profileError || !profile) {
      throw new Error(profileError?.message || 'User profile not found');
    }
    
    const mappedUser = mapProfile(profile);
    
    if (mappedUser.status === 'PENDING') throw new Error('Your account is pending approval');
    if (mappedUser.status === 'REJECTED') throw new Error('Your account registration was rejected');
    if (mappedUser.status === 'BLOCKED') throw new Error('Your account has been blocked');
    
    set({ currentUser: mappedUser });
    await get().fetchData();
    await get().addAuditLog('LOGIN', `User ${mappedUser.name} logged in`);
    return mappedUser;
  },

  logout: async () => {
    if (isMockMode) {
      set({ currentUser: null, users: [], colleges: [], departments: [], students: [], notifications: [], auditLogs: [] });
      localStorage.removeItem('stuvault_mock_current_user');
      await get().fetchPublicData();
      return;
    }
    await supabase.auth.signOut();
    set({ currentUser: null, users: [], colleges: [], departments: [], students: [], notifications: [], auditLogs: [] });
  },

  updateProfile: async (data) => {
    const currentUser = get().currentUser;
    if (!currentUser) throw new Error('Not logged in');
    if (isMockMode) {
      const users = getLocalStorage<User[]>('stuvault_mock_users', DEFAULT_USERS);
      const idx = users.findIndex(u => u.id === currentUser.id);
      const updated = { ...currentUser, ...data };
      if (idx !== -1) users[idx] = updated;
      setLocalStorage('stuvault_mock_users', users);
      setLocalStorage('stuvault_mock_current_user', updated);
      set({ currentUser: updated });
      await get().fetchData();
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ name: data.name, mobile: data.mobile || null, designation: data.designation || null, avatar_url: data.avatarUrl || null })
      .eq('id', currentUser.id);
    if (error) throw new Error(error.message);
    set({ currentUser: { ...currentUser, ...data } });
    await get().fetchData();
  },

  register: async (userData, password) => {
    if (!password) throw new Error('Password required');
    if (isMockMode) {
      const users = getLocalStorage<User[]>('stuvault_mock_users', DEFAULT_USERS);
      const exists = users.some(u => u.email === userData.email);
      if (exists) throw new Error('User already exists');
      
      const newUser: User = {
        id: 'user-id-' + Math.random().toString(36).slice(2),
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        collegeId: userData.collegeId,
        departmentId: userData.departmentId,
        mobile: userData.mobile,
        designation: userData.designation,
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      setLocalStorage('stuvault_mock_users', users);
      // Store password for this user so they can login and change password later
      const passwords = getLocalStorage<Record<string, string>>('stuvault_mock_passwords', {});
      passwords[newUser.id] = password;
      setLocalStorage('stuvault_mock_passwords', passwords);
      return;
    }
    const { error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password,
      options: {
        data: {
          name: userData.name,
          role: userData.role,
          college_id: userData.collegeId || null,
          department_id: userData.departmentId || null,
          mobile: userData.mobile || null,
          designation: userData.designation || null
        }
      }
    });
    
    if (authError) throw new Error(authError.message);
  },

  approveUser: async (userId, collegeId, departmentId) => {
    const targetUser = get().users.find(u => u.id === userId);
    const userName = targetUser ? `${targetUser.name} (${targetUser.role})` : userId;
    if (isMockMode) {
      const users = getLocalStorage<User[]>('stuvault_mock_users', DEFAULT_USERS);
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex].status = 'APPROVED';
        if (collegeId) users[userIndex].collegeId = collegeId;
        if (departmentId) users[userIndex].departmentId = departmentId;
        setLocalStorage('stuvault_mock_users', users);
        await get().fetchData();
        await get().addAuditLog('APPROVE_USER', `Approved user: ${userName}`);
      }
      return;
    }
    const updates: any = { status: 'APPROVED' };
    if (collegeId) updates.college_id = collegeId;
    if (departmentId) updates.department_id = departmentId;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    if (error) throw new Error(error.message);
    await get().fetchData();
    await get().addAuditLog('APPROVE_USER', `Approved user: ${userName}`);
  },

  rejectUser: async (userId) => {
    const targetUser = get().users.find(u => u.id === userId);
    const userName = targetUser ? `${targetUser.name} (${targetUser.role})` : userId;
    if (isMockMode) {
      const users = getLocalStorage<User[]>('stuvault_mock_users', DEFAULT_USERS);
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex].status = 'REJECTED';
        setLocalStorage('stuvault_mock_users', users);
        await get().fetchData();
        await get().addAuditLog('REJECT_USER', `Rejected registration for user: ${userName}`);
      }
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'REJECTED' })
      .eq('id', userId);
    if (error) throw new Error(error.message);
    await get().fetchData();
    await get().addAuditLog('REJECT_USER', `Rejected registration for user: ${userName}`);
  },

  blockUser: async (userId) => {
    const targetUser = get().users.find(u => u.id === userId);
    const userName = targetUser ? `${targetUser.name} (${targetUser.role})` : userId;
    if (isMockMode) {
      const users = getLocalStorage<User[]>('stuvault_mock_users', DEFAULT_USERS);
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex].status = 'BLOCKED';
        setLocalStorage('stuvault_mock_users', users);
        await get().fetchData();
        await get().addAuditLog('BLOCK_USER', `Blocked user: ${userName}`);
      }
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'BLOCKED' })
      .eq('id', userId);
    if (error) throw new Error(error.message);
    await get().fetchData();
    await get().addAuditLog('BLOCK_USER', `Blocked user: ${userName}`);
  },

  unblockUser: async (userId) => {
    const targetUser = get().users.find(u => u.id === userId);
    const userName = targetUser ? `${targetUser.name} (${targetUser.role})` : userId;
    if (isMockMode) {
      const users = getLocalStorage<User[]>('stuvault_mock_users', DEFAULT_USERS);
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex].status = 'APPROVED';
        setLocalStorage('stuvault_mock_users', users);
        await get().fetchData();
        await get().addAuditLog('UNBLOCK_USER', `Unblocked user: ${userName}`);
      }
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'APPROVED' })
      .eq('id', userId);
    if (error) throw new Error(error.message);
    await get().fetchData();
    await get().addAuditLog('UNBLOCK_USER', `Unblocked user: ${userName}`);
  },

  changePassword: async (currentPassword, newPassword) => {
    const currentUser = get().currentUser;
    if (!currentUser) throw new Error('Not logged in');
    if (isMockMode) {
      const passwords = getLocalStorage<Record<string, string>>('stuvault_mock_passwords', {});
      const storedPassword = passwords[currentUser.id];
      // Super admin default password is 'admin' if none stored
      const effectiveCurrent = storedPassword || (currentUser.id === 'super-admin-id-12345' ? 'admin' : null);
      if (!effectiveCurrent) {
        // For other users registered via form, their initial stored password is set at register time
        throw new Error('Cannot verify current password');
      }
      if (effectiveCurrent !== currentPassword) {
        throw new Error('Current password is incorrect');
      }
      passwords[currentUser.id] = newPassword;
      setLocalStorage('stuvault_mock_passwords', passwords);
      await get().addAuditLog('CHANGE_PASSWORD', `Changed profile password`);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    await get().addAuditLog('CHANGE_PASSWORD', `Changed profile password`);
  },

  addNotification: async (notification) => {
    if (isMockMode) {
      const notifs = getLocalStorage<Notification[]>('stuvault_mock_notifications', []);
      const newNotif: Notification = {
        id: 'notif-id-' + Math.random().toString(36).slice(2),
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        createdAt: new Date().toISOString()
      };
      notifs.push(newNotif);
      setLocalStorage('stuvault_mock_notifications', notifs);
      await get().fetchData();
      return;
    }
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        is_read: notification.isRead
      });
    if (error) throw new Error(error.message);
    await get().fetchData();
  },

  markNotificationRead: async (id) => {
    if (isMockMode) {
      const notifs = getLocalStorage<Notification[]>('stuvault_mock_notifications', []);
      const index = notifs.findIndex(n => n.id === id);
      if (index !== -1) {
        notifs[index].isRead = true;
        setLocalStorage('stuvault_mock_notifications', notifs);
        await get().fetchData();
      }
      return;
    }
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) throw new Error(error.message);
    await get().fetchData();
  },

  markAllNotificationsRead: async () => {
    const currentUser = get().currentUser;
    if (!currentUser) return;
    if (isMockMode) {
      const notifs = getLocalStorage<Notification[]>('stuvault_mock_notifications', []);
      notifs.forEach(n => { if (n.userId === currentUser.id) n.isRead = true; });
      setLocalStorage('stuvault_mock_notifications', notifs);
      await get().fetchData();
      return;
    }
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', currentUser.id);
    await get().fetchData();
  },

  addAuditLog: async (action, details) => {
    const currentUser = get().currentUser;
    const newLog: AuditLog = {
      id: 'log-' + Math.random().toString(36).slice(2, 11),
      userId: currentUser?.id || 'anonymous',
      userName: currentUser?.name || 'Anonymous',
      userEmail: currentUser?.email || 'anonymous@stuvault.com',
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    const logs = getLocalStorage<AuditLog[]>('stuvault_mock_logs', []);
    logs.unshift(newLog);
    // Limit local logs count to 200 items to avoid localStorage bloat
    const limitedLogs = logs.slice(0, 200);
    setLocalStorage('stuvault_mock_logs', limitedLogs);
    set({ auditLogs: limitedLogs });
  },

  addCollege: async (college) => {
    if (isMockMode) {
      const colleges = getLocalStorage<College[]>('stuvault_mock_colleges', DEFAULT_COLLEGES);
      const newCollege: College = {
        id: 'college-id-' + Math.random().toString(36).slice(2),
        name: college.name,
        code: college.code,
        address: college.address,
        status: college.status,
        logoUrl: college.logoUrl,
        createdAt: new Date().toISOString()
      };
      colleges.push(newCollege);
      setLocalStorage('stuvault_mock_colleges', colleges);
      await get().fetchData();
      await get().addAuditLog('ADD_COLLEGE', `Created college: ${college.name} (${college.code})`);
      return;
    }
    const { error } = await supabase
      .from('colleges')
      .insert({
        name: college.name,
        code: college.code,
        address: college.address,
        status: college.status,
        logo_url: college.logoUrl
      });
    if (error) throw new Error(error.message);
    await get().fetchData();
    await get().addAuditLog('ADD_COLLEGE', `Created college: ${college.name} (${college.code})`);
  },

  updateCollege: async (id, data) => {
    const target = get().colleges.find(c => c.id === id);
    const collegeName = target ? `${target.name} (${target.code})` : id;
    if (isMockMode) {
      const colleges = getLocalStorage<College[]>('stuvault_mock_colleges', DEFAULT_COLLEGES);
      const idx = colleges.findIndex(c => c.id === id);
      if (idx !== -1) {
        colleges[idx] = { ...colleges[idx], ...data };
        setLocalStorage('stuvault_mock_colleges', colleges);
        await get().fetchData();
        await get().addAuditLog('UPDATE_COLLEGE', `Updated college: ${collegeName}`);
      }
      return;
    }
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.logoUrl !== undefined) updateData.logo_url = data.logoUrl;
    const { error } = await supabase.from('colleges').update(updateData).eq('id', id);
    if (error) throw new Error(error.message);
    await get().fetchData();
    await get().addAuditLog('UPDATE_COLLEGE', `Updated college: ${collegeName}`);
  },

  deleteCollege: async (id) => {
    const target = get().colleges.find(c => c.id === id);
    const collegeName = target ? `${target.name} (${target.code})` : id;
    if (isMockMode) {
      let colleges = getLocalStorage<College[]>('stuvault_mock_colleges', DEFAULT_COLLEGES);
      colleges = colleges.filter(c => c.id !== id);
      setLocalStorage('stuvault_mock_colleges', colleges);
      // Also remove orphaned departments and students
      let departments = getLocalStorage<Department[]>('stuvault_mock_departments', DEFAULT_DEPARTMENTS);
      const removedDeptIds = departments.filter(d => d.collegeId === id).map(d => d.id);
      departments = departments.filter(d => d.collegeId !== id);
      setLocalStorage('stuvault_mock_departments', departments);
      let students = getLocalStorage<Student[]>('stuvault_mock_students', DEFAULT_STUDENTS);
      students = students.filter(s => s.collegeId !== id && !removedDeptIds.includes(s.departmentId));
      setLocalStorage('stuvault_mock_students', students);
      await get().fetchData();
      await get().addAuditLog('DELETE_COLLEGE', `Deleted college: ${collegeName} and all its subdivisions`);
      return;
    }
    const { error } = await supabase.from('colleges').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await get().fetchData();
    await get().addAuditLog('DELETE_COLLEGE', `Deleted college: ${collegeName}`);
  },

  addDepartment: async (department) => {
    if (isMockMode) {
      const departments = getLocalStorage<Department[]>('stuvault_mock_departments', DEFAULT_DEPARTMENTS);
      const newDept: Department = {
        id: 'dept-id-' + Math.random().toString(36).slice(2),
        collegeId: department.collegeId,
        name: department.name,
        code: department.code,
        adminId: department.adminId,
        createdAt: new Date().toISOString()
      };
      departments.push(newDept);
      setLocalStorage('stuvault_mock_departments', departments);
      await get().fetchData();
      await get().addAuditLog('ADD_DEPARTMENT', `Created department: ${department.name} (${department.code})`);
      return;
    }
    const { error } = await supabase
      .from('departments')
      .insert({
        college_id: department.collegeId,
        name: department.name,
        code: department.code,
        admin_id: department.adminId
      });
    if (error) throw new Error(error.message);
    await get().fetchData();
    await get().addAuditLog('ADD_DEPARTMENT', `Created department: ${department.name} (${department.code})`);
  },

  updateDepartment: async (id, data) => {
    const target = get().departments.find(d => d.id === id);
    const deptName = target ? `${target.name} (${target.code})` : id;
    if (isMockMode) {
      const departments = getLocalStorage<Department[]>('stuvault_mock_departments', DEFAULT_DEPARTMENTS);
      const idx = departments.findIndex(d => d.id === id);
      if (idx !== -1) {
        departments[idx] = { ...departments[idx], ...data };
        setLocalStorage('stuvault_mock_departments', departments);
        await get().fetchData();
        await get().addAuditLog('UPDATE_DEPARTMENT', `Updated department: ${deptName}`);
      }
      return;
    }
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.collegeId !== undefined) updateData.college_id = data.collegeId;
    if (data.adminId !== undefined) updateData.admin_id = data.adminId;
    const { error } = await supabase.from('departments').update(updateData).eq('id', id);
    if (error) throw new Error(error.message);
    await get().fetchData();
    await get().addAuditLog('UPDATE_DEPARTMENT', `Updated department: ${deptName}`);
  },

  deleteDepartment: async (id) => {
    const target = get().departments.find(d => d.id === id);
    const deptName = target ? `${target.name} (${target.code})` : id;
    if (isMockMode) {
      let departments = getLocalStorage<Department[]>('stuvault_mock_departments', DEFAULT_DEPARTMENTS);
      departments = departments.filter(d => d.id !== id);
      setLocalStorage('stuvault_mock_departments', departments);
      let students = getLocalStorage<Student[]>('stuvault_mock_students', DEFAULT_STUDENTS);
      students = students.filter(s => s.departmentId !== id);
      setLocalStorage('stuvault_mock_students', students);
      await get().fetchData();
      await get().addAuditLog('DELETE_DEPARTMENT', `Deleted department: ${deptName} and all associated students`);
      return;
    }
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await get().fetchData();
    await get().addAuditLog('DELETE_DEPARTMENT', `Deleted department: ${deptName}`);
  },

  addStudent: async (student) => {
    if (isMockMode) {
      const students = getLocalStorage<Student[]>('stuvault_mock_students', DEFAULT_STUDENTS);
      const newStudent: Student = {
        id: 'student-id-' + Math.random().toString(36).slice(2),
        collegeId: student.collegeId,
        departmentId: student.departmentId,
        hallTicket: student.hallTicket,
        name: student.name,
        email: student.email,
        phone: student.phone,
        semester: student.semester,
        cgpa: student.cgpa,
        status: student.status,
        photoUrl: student.photoUrl,
        createdAt: new Date().toISOString()
      };
      students.push(newStudent);
      setLocalStorage('stuvault_mock_students', students);
      await get().fetchData();
      await get().addAuditLog('ADD_STUDENT', `Added student: ${student.name} (${student.hallTicket})`);
      return;
    }
    const { error } = await supabase
      .from('students')
      .insert({
        college_id: student.collegeId,
        department_id: student.departmentId,
        hall_ticket: student.hallTicket,
        name: student.name,
        email: student.email,
        phone: student.phone,
        semester: student.semester,
        cgpa: student.cgpa,
        status: student.status,
        photo_url: student.photoUrl || null
      });
    if (error) throw new Error(error.message);
    await get().fetchData();
    await get().addAuditLog('ADD_STUDENT', `Added student: ${student.name} (${student.hallTicket})`);
  },

  updateStudent: async (id, data) => {
    const target = get().students.find(s => s.id === id);
    const studentName = target ? `${target.name} (${target.hallTicket})` : id;
    if (isMockMode) {
      const students = getLocalStorage<Student[]>('stuvault_mock_students', DEFAULT_STUDENTS);
      const idx = students.findIndex(s => s.id === id);
      if (idx !== -1) {
        students[idx] = { ...students[idx], ...data };
        setLocalStorage('stuvault_mock_students', students);
        await get().fetchData();
        await get().addAuditLog('UPDATE_STUDENT', `Updated student profile: ${studentName}`);
      }
      return;
    }
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.semester !== undefined) updateData.semester = data.semester;
    if (data.cgpa !== undefined) updateData.cgpa = data.cgpa;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.photoUrl !== undefined) updateData.photo_url = data.photoUrl || null;
    const { error } = await supabase.from('students').update(updateData).eq('id', id);
    if (error) throw new Error(error.message);
    await get().fetchData();
    await get().addAuditLog('UPDATE_STUDENT', `Updated student profile: ${studentName}`);
  },

  deleteStudent: async (id) => {
    const target = get().students.find(s => s.id === id);
    const studentName = target ? `${target.name} (${target.hallTicket})` : id;
    if (isMockMode) {
      let students = getLocalStorage<Student[]>('stuvault_mock_students', DEFAULT_STUDENTS);
      students = students.filter(s => s.id !== id);
      setLocalStorage('stuvault_mock_students', students);
      await get().fetchData();
      await get().addAuditLog('DELETE_STUDENT', `Deleted student record: ${studentName}`);
      return;
    }
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await get().fetchData();
    await get().addAuditLog('DELETE_STUDENT', `Deleted student record: ${studentName}`);
  },
}));
