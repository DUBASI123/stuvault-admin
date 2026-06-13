import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '../lib/store';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Loader2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  designation: z.string().min(2, "Designation is required"),
  collegeId: z.string().min(1, "College is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

export default function RegisterCollegeAdmin() {
  const registerUser = useStore(state => state.register);
  const colleges = useStore(state => state.colleges);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        designation: data.designation,
        collegeId: data.collegeId,
        role: 'COLLEGE_ADMIN',
        status: 'PENDING',
      }, data.password);
      toast.success("Registration successful! Pending Super Admin approval.");
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-radial from-slate-900 via-slate-950 to-black font-sans relative">
      {/* Glowing backdrop */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="mx-auto flex justify-center h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3 text-blue-400">
          <Building2 className="h-6 w-6" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold font-display text-white">
          College Admin Registration
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Full Name</label>
              <input {...register('name')} type="text" className="mt-1 block w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm" placeholder="John Doe" />
              {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Email Address</label>
              <input {...register('email')} type="email" className="mt-1 block w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm" placeholder="john@college.edu" />
              {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Mobile Number</label>
              <input {...register('mobile')} type="tel" className="mt-1 block w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm" placeholder="1234567890" />
              {errors.mobile && <p className="mt-1 text-sm text-red-400">{errors.mobile.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Designation</label>
              <input {...register('designation')} type="text" className="mt-1 block w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm" placeholder="Dean / Administrator" />
              {errors.designation && <p className="mt-1 text-sm text-red-400">{errors.designation.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Select College</label>
              <select {...register('collegeId')} className="mt-1 block w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm">
                <option value="" className="bg-slate-950">-- Select College --</option>
                {colleges.filter(c => c.status === 'APPROVED' || c.status === 'ACTIVE').map(college => (
                  <option key={college.id} value={college.id} className="bg-slate-950">{college.name}</option>
                ))}
              </select>
              {errors.collegeId && <p className="mt-1 text-sm text-red-400">{errors.collegeId.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
              <input {...register('password')} type="password" className="mt-1 block w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm" placeholder="••••••••" />
              {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Confirm Password</label>
              <input {...register('confirmPassword')} type="password" className="mt-1 block w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm" placeholder="••••••••" />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>}
            </div>

            <div className="pt-2">
              <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer">
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Submitting...
                  </>
                ) : 'Submit Request'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center border-t border-white/5 pt-4">
            <Link to="/register" className="text-sm font-semibold text-slate-400 hover:text-slate-300 transition-colors">
              &larr; Back to Role Selection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

