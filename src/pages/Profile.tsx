import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '../lib/store';
import { User, Mail, Phone, Award, Building2, Library, ShieldCheck, Loader2, Save, Calendar, KeyRound, Eye, EyeOff, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { uploadToCloudinary } from '../lib/cloudinary';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().optional(),
  designation: z.string().optional(),
  avatarUrl: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  COLLEGE_ADMIN: 'College Admin',
  DEPARTMENT_ADMIN: 'Department Admin',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'from-purple-500 to-indigo-600 shadow-purple-500/20',
  COLLEGE_ADMIN: 'from-blue-500 to-cyan-600 shadow-blue-500/20',
  DEPARTMENT_ADMIN: 'from-indigo-500 to-violet-600 shadow-indigo-500/20',
};

export default function Profile() {
  const { currentUser, colleges, departments, updateProfile, changePassword } = useStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors, isDirty }, setValue } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser?.name ?? '',
      mobile: currentUser?.mobile ?? '',
      designation: currentUser?.designation ?? '',
      avatarUrl: currentUser?.avatarUrl ?? '',
    },
  });

  const { register: registerPwd, handleSubmit: handlePwdSubmit, reset: resetPwd, formState: { errors: pwdErrors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  if (!currentUser) return null;

  const college = colleges.find(c => c.id === currentUser.collegeId);
  const department = departments.find(d => d.id === currentUser.departmentId);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const url = await uploadToCloudinary(file);
      setValue('avatarUrl', url, { shouldDirty: true });
      await updateProfile({
        name: currentUser.name,
        mobile: currentUser.mobile,
        designation: currentUser.designation,
        avatarUrl: url,
      });
      toast.success('Profile photo updated!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to upload photo');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    setIsSaving(true);
    try {
      await updateProfile(data);
      toast.success('Profile updated successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsChangingPwd(true);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      toast.success('Password changed successfully');
      resetPwd();
    } catch (e: any) {
      toast.error(e.message || 'Failed to change password');
    } finally {
      setIsChangingPwd(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-3xl">
      <div>
        <h2 className="text-3xl font-extrabold font-display text-slate-800 tracking-tight">
          My Profile
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal information and account details
        </p>
      </div>

      {/* Profile hero card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar with upload */}
          <div className="relative flex-shrink-0 group">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <div
              className={`h-20 w-20 rounded-2xl bg-gradient-to-tr ${ROLE_COLORS[currentUser.role]} flex items-center justify-center text-white font-bold text-3xl shadow-xl overflow-hidden relative`}
              style={{ cursor: 'pointer' }}
              onClick={() => avatarInputRef.current?.click()}
            >
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                currentUser.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-2xl">
                {isUploadingAvatar ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-blue-500 border-2 border-slate-900 flex items-center justify-center" onClick={() => avatarInputRef.current?.click()} style={{ cursor: 'pointer' }}>
              <Camera className="h-3 w-3 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">{currentUser.name}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/10 text-sm font-semibold text-white/80">
                <ShieldCheck className="h-4 w-4" />
                {ROLE_LABELS[currentUser.role]}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold ${
                currentUser.status === 'APPROVED' || currentUser.status === 'ACTIVE'
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
              }`}>
                {currentUser.status}
              </span>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-slate-400">
              <Calendar className="h-4 w-4" />
              Member since {formatDistanceToNow(new Date(currentUser.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Mail className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Email</span>
          </div>
          <p className="text-sm font-semibold text-slate-700 truncate">{currentUser.email}</p>
          <p className="text-xs text-slate-400 mt-1">Read-only</p>
        </div>
        {college && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Building2 className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">College</span>
            </div>
            <p className="text-sm font-semibold text-slate-700 truncate">{college.name}</p>
            <p className="text-xs text-slate-400 mt-1">Code: {college.code}</p>
          </div>
        )}
        {department && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Library className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Department</span>
            </div>
            <p className="text-sm font-semibold text-slate-700 truncate">{department.name}</p>
            <p className="text-xs text-slate-400 mt-1">Code: {department.code}</p>
          </div>
        )}
      </div>

      {/* Edit form */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold font-display text-slate-800">Edit Information</h3>
          <p className="text-sm text-slate-500 mt-0.5">Update your name, mobile number, and designation</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                <User className="h-3.5 w-3.5 inline mr-1.5" />
                Full Name
              </label>
              <input
                {...register('name')}
                type="text"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="Your full name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                <Phone className="h-3.5 w-3.5 inline mr-1.5" />
                Mobile Number
              </label>
              <input
                {...register('mobile')}
                type="tel"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="e.g. 9876543210"
              />
              {errors.mobile && <p className="mt-1 text-sm text-red-500">{errors.mobile.message}</p>}
            </div>

            {/* Designation */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                <Award className="h-3.5 w-3.5 inline mr-1.5" />
                Designation
              </label>
              <input
                {...register('designation')}
                type="text"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="e.g. Dean / HOD"
              />
              {errors.designation && <p className="mt-1 text-sm text-red-500">{errors.designation.message}</p>}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving || !isDirty}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-blue-500/20"
            >
              {isSaving ? (
                <><Loader2 className="animate-spin h-4 w-4" />Saving...</>
              ) : (
                <><Save className="h-4 w-4" />Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold font-display text-slate-800">Change Password</h3>
          <p className="text-sm text-slate-500 mt-0.5">Update your account password</p>
        </div>
        <form onSubmit={handlePwdSubmit(onPasswordSubmit)} className="px-6 py-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              <KeyRound className="h-3.5 w-3.5 inline mr-1.5" />
              Current Password
            </label>
            <div className="relative">
              <input
                {...registerPwd('currentPassword')}
                type={showCurrentPwd ? 'text' : 'password'}
                className="block w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="Enter current password"
              />
              <button type="button" onClick={() => setShowCurrentPwd(v => !v)} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwdErrors.currentPassword && <p className="mt-1 text-sm text-red-500">{pwdErrors.currentPassword.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  {...registerPwd('newPassword')}
                  type={showNewPwd ? 'text' : 'password'}
                  className="block w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="Min. 6 characters"
                />
                <button type="button" onClick={() => setShowNewPwd(v => !v)} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                  {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {pwdErrors.newPassword && <p className="mt-1 text-sm text-red-500">{pwdErrors.newPassword.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                {...registerPwd('confirmPassword')}
                type="password"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="Re-enter new password"
              />
              {pwdErrors.confirmPassword && <p className="mt-1 text-sm text-red-500">{pwdErrors.confirmPassword.message}</p>}
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={isChangingPwd}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-indigo-500/20"
            >
              {isChangingPwd ? (
                <><Loader2 className="animate-spin h-4 w-4" />Updating...</>
              ) : (
                <><KeyRound className="h-4 w-4" />Update Password</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Account ID info */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Account ID</p>
        <p className="text-sm font-mono text-slate-600 select-all">{currentUser.id}</p>
      </div>
    </div>
  );
}
