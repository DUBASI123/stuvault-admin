import { Link } from 'react-router-dom';
import { Building2, Library } from 'lucide-react';

export default function RegisterSelection() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-radial from-slate-900 via-slate-950 to-black py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Decorative gradient glowing spots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-3xl w-full space-y-8 relative z-10">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold font-display text-white tracking-tight">
            Register for StuVault
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Select your administrative role to continue
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <Link
            to="/register/college-admin"
            className="relative group bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:border-blue-500/30 hover:bg-white/10 transition-all duration-350 cursor-pointer"
          >
            <div>
              <span className="rounded-xl inline-flex p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all">
                <Building2 className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-bold font-display text-white group-hover:text-blue-400 transition-colors">
                <span className="absolute inset-0" aria-hidden="true" />
                College Admin
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Register a new college and manage departments, department admins, and college-wide settings.
              </p>
            </div>
          </Link>

          <Link
            to="/register/department-admin"
            className="relative group bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:border-purple-500/30 hover:bg-white/10 transition-all duration-350 cursor-pointer"
          >
            <div>
              <span className="rounded-xl inline-flex p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-all">
                <Library className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-bold font-display text-white group-hover:text-purple-400 transition-colors">
                <span className="absolute inset-0" aria-hidden="true" />
                Department Admin
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Register to manage a specific department, including students, attendance, and results.
              </p>
            </div>
          </Link>
        </div>
        
        <div className="text-center mt-8 pt-4">
          <Link to="/" className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
            &larr; Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

