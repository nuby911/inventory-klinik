import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function CaduceusIcon({ className = "w-12 h-12" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Central Staff & Knob */}
      <circle cx="50" cy="14" r="6" />
      <path d="M48 18 H52 V88 H48 Z" rx="2" />
      <circle cx="50" cy="90" r="3" />
      
      {/* Left Wing */}
      <path d="M48 24 C32 12, 16 16, 10 27 C 22 28, 34 32, 48 38 Z" opacity="0.95" />
      {/* Right Wing */}
      <path d="M52 24 C68 12, 84 16, 90 27 C 78 28, 66 32, 52 38 Z" opacity="0.95" />
      
      {/* Entwined Serpents Left Body */}
      <path
        d="M48 38 C 30 42, 28 52, 42 60 C 50 64, 52 70, 48 76 C 44 82, 38 84, 46 88 C 47 88, 48 87, 49 86 C 45 84, 47 80, 50 75 C 56 68, 52 60, 44 56 C 36 52, 36 46, 48 42 Z"
      />
      {/* Entwined Serpents Right Body */}
      <path
        d="M52 38 C 70 42, 72 52, 58 60 C 50 64, 48 70, 52 76 C 56 82, 62 84, 54 88 C 53 88, 52 87, 51 86 C 55 84, 53 80, 50 75 C 44 68, 48 60, 56 56 C 64 52, 64 46, 52 42 Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { login, loading, error, setError } = useAuth();
  const [selectedRole, setSelectedRole] = useState('dokter');
  const [email, setEmail] = useState('dokter@almedika.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState(null);

  const roles = [
    {
      id: 'dokter',
      label: 'Dokter',
      name: 'Dokter',
      roleTitle: 'Pemeriksa Rawat Jalan',
      email: 'dokter@almedika.com',
      defaultPass: 'password123'
    },
    {
      id: 'apoteker',
      label: 'Apoteker',
      name: 'Apoteker',
      roleTitle: 'Instalasi Farmasi',
      email: 'apoteker@almedika.com',
      defaultPass: 'password123'
    },
    {
      id: 'admin',
      label: 'Logistik',
      name: 'Logistik',
      roleTitle: 'Gudang & Logistik',
      email: 'admin@almedika.com',
      defaultPass: 'password123'
    }
  ];

  const handleRoleSelect = (roleObj) => {
    setSelectedRole(roleObj.id);
    setEmail(roleObj.email);
    setPassword(roleObj.defaultPass);
    setLocalError(null);
    if (setError) setError(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLocalError(null);
    if (setError) setError(null);

    try {
      await login({
        email,
        password,
        role: selectedRole
      });
      window.history.replaceState(null, '', `/${selectedRole}/dashboard`);
    } catch (err) {
      setLocalError(err.message || 'Kredensial tidak sesuai atau peran akun tidak cocok.');
    }
  };

  const activeRole = roles.find(r => r.id === selectedRole) || roles[0];

  return (
    <div 
      className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 relative select-none"
      style={{
        background: 'linear-gradient(135deg, #74cbe9 0%, #46b4de 40%, #299dc9 100%)'
      }}
    >
      {/* Background Soft Medical Glow */}
      <div className="absolute inset-0 bg-radial from-white/20 via-transparent to-black/10 pointer-events-none" />

      {/* Top Brand Header (Caduceus Logo & Text) */}
      <div className="relative z-10 flex items-center justify-center gap-3 mb-6 sm:mb-8 text-[#030879]">
        <CaduceusIcon className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 drop-shadow-xs" />
        <div className="flex flex-col">
          <span className="font-extrabold text-2xl sm:text-3xl tracking-tight leading-none">
            Klinik Almedika
          </span>
          <span className="font-semibold text-xs sm:text-sm tracking-wider uppercase opacity-85 mt-1">
            SIM Farmasi & Rawat Jalan
          </span>
        </div>
      </div>

      {/* Main Glass/Cyan Login Panel */}
      <div className="relative z-10 w-full max-w-[580px] bg-gradient-to-b from-[#2b9eca] to-[#1c8bb7] rounded-[32px] sm:rounded-[40px] border-2 border-white/90 shadow-[0_20px_50px_rgba(3,20,70,0.3)] p-6 sm:p-10 overflow-hidden">
        
        {/* Subtle Watermark Inside Card */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.09] text-white">
          <CaduceusIcon className="w-80 h-80 transform -rotate-6" />
        </div>

        {/* Card Title */}
        <h2 className="relative z-10 text-center text-white text-xl sm:text-2xl font-light tracking-[0.22em] uppercase mb-6 sm:mb-7 drop-shadow-xs">
          USER LOGIN
        </h2>

        {/* Role Selector Pills */}
        <div className="relative z-10 flex items-center justify-center gap-2.5 sm:gap-3.5 mb-5">
          {roles.map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleSelect(r)}
                className={`px-5 sm:px-7 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-md ${
                  isSelected
                    ? 'bg-[#060eff] text-white shadow-lg ring-2 ring-white/70 scale-105'
                    : 'bg-[#030879] text-white/90 hover:bg-[#05109b] hover:text-white'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Active Staff Info Pill */}
        <div className="relative z-10 flex justify-center mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#030879]/30 backdrop-blur-xs text-white/95 text-[11px] sm:text-xs font-medium border border-white/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
            <span>Akses Peran: <strong>{activeRole.name}</strong> ({activeRole.roleTitle})</span>
          </div>
        </div>

        {/* Error Notification */}
        {(localError || error) && (
          <div className="relative z-10 mb-4 px-4 py-2.5 bg-white text-rose-700 text-xs font-semibold rounded-full shadow-md flex items-center justify-center gap-2 max-w-[460px] mx-auto border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="truncate">{localError || error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="relative z-10 max-w-[460px] mx-auto space-y-3.5 sm:space-y-4">
          
          {/* Email Pill Input */}
          <div className="relative">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#1b8ebc] text-white flex items-center justify-center shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@almedika.com"
              className="w-full h-12 sm:h-13 pl-13 pr-4 rounded-full bg-white text-slate-800 font-medium text-xs sm:text-sm border border-slate-200/60 shadow-inner focus:outline-hidden focus:ring-2 focus:ring-white transition"
            />
          </div>

          {/* Password Pill Input */}
          <div className="relative">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#1b8ebc] text-white flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-12 sm:h-13 pl-13 pr-11 rounded-full bg-white text-slate-800 font-medium text-xs sm:text-sm border border-slate-200/60 shadow-inner focus:outline-hidden focus:ring-2 focus:ring-white transition font-mono tracking-wider"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Auxiliary Links (Remember Me & Forgot Password) */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-white/95 px-3 py-1 font-medium">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-white/60 bg-white/20 text-[#030879] focus:ring-0 cursor-pointer accent-[#030879]"
              />
              <span>Remember Me</span>
            </label>
            <button
              type="button"
              onClick={() => alert('Untuk bantuan reset sandi, hubungi bagian IT Administrator Klinik Almedika.')}
              className="text-white hover:text-white/80 hover:underline cursor-pointer"
            >
              Forget Password ?
            </button>
          </div>

          {/* Login Submit Button */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={loading}
              className="min-w-[150px] px-8 py-2.5 sm:py-3 rounded-full bg-[#030879] hover:bg-[#020557] active:bg-[#010338] text-white font-semibold text-sm sm:text-base tracking-wide shadow-lg hover:shadow-xl transition-all duration-150 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </div>

        </form>

      </div>

      {/* Footer Info */}
      <div className="relative z-10 mt-6 text-center text-xs text-[#030879]/80 font-medium">
        <p>© {new Date().getFullYear()} Klinik Almedika Rajabasa · Bandar Lampung</p>
      </div>

    </div>
  );
}
