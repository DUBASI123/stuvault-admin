import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '../lib/store';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, Loader2, Info, ChevronDown, ChevronUp, Key } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const login = useStore(state => state.login);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoBox, setShowDemoBox] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success("Login successful!");
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const autofill = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
    toast.success("Credentials autofilled!");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-radial from-slate-900 via-slate-950 to-black py-12 px-4 sm:px-6 lg:px-8 font-sans gap-8">
      {/* Decorative gradient glowing spots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Main Login Card */}
      <div className="max-w-md w-full space-y-8 bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-2xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center">
          <div className="p-4 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-center text-4xl font-extrabold font-display text-white tracking-tight">
            StuVault
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Enter your credentials to access the admin portal
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Email Address</label>
              <input
                {...register('email')}
                type="email"
                className="mt-1 block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="admin@example.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
              <input
                {...register('password')}
                type="password"
                className="mt-1 block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="#" className="font-medium text-blue-400 hover:text-blue-300 transition-colors" onClick={(e) => {e.preventDefault(); toast("Forgot password flow not implemented.", {icon: 'ℹ'})}}>
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center mt-4 border-t border-white/5 pt-4">
            <span className="text-sm text-slate-400">Don't have an account? </span>
            <Link to="/register" className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              Register Here
            </Link>
          </div>
        </form>
      </div>

      {/* Demo Credentials Box */}
      <div className="w-full max-w-sm bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl text-slate-300 relative z-10">
        <button
          onClick={() => setShowDemoBox(!showDemoBox)}
          className="flex items-center justify-between w-full text-left font-bold text-white hover:text-blue-400 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2 text-sm uppercase tracking-wider">
            <Info className="h-4 w-4 text-blue-400" />
            Quick Access & Demo Guide
          </span>
          {showDemoBox ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showDemoBox && (
          <div className="mt-4 space-y-4 text-xs leading-relaxed border-t border-white/5 pt-4">
            <div>
              <p className="text-slate-400 font-semibold mb-1">Super Admin Account:</p>
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/5">
                <div>
                  <span className="text-white">superadmin@stuvault.com</span>
                  <span className="text-slate-500 block font-mono">Password: admin</span>
                </div>
                <button
                  onClick={() => autofill('superadmin@stuvault.com', 'admin')}
                  className="px-2 py-1 rounded bg-blue-500 text-white font-bold hover:bg-blue-600 cursor-pointer transition-colors"
                >
                  Autofill
                </button>
              </div>
            </div>

            <div className="bg-slate-950/40 rounded-xl p-3 border border-blue-500/10">
              <span className="flex items-center gap-1.5 font-bold text-white text-[11px] uppercase tracking-wider mb-1.5 text-blue-400">
                <Key className="h-3.5 w-3.5" />
                Operational Workflow
              </span>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Register a College / Dept Admin</li>
                <li>Log in as <span className="text-white font-semibold">Super Admin</span></li>
                <li>Go to <span className="text-white font-semibold">Approvals</span> & approve them</li>
                <li>Log out & sign in as approved admin</li>
                <li>Dept/College Admins manage division & students</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

