import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export default function LoginPage() {
  const { login, loading, error, setError } = useAuth();
  const [selectedRole, setSelectedRole] = useState('dokter');
  const [email, setEmail] = useState('dokter@almedika.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

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
      className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 relative select-none overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #091f36 0%, #0f3d6b 45%, #155ea3 100%)'
      }}
    >
      {/* Background Soft Medical Ambient Glow (Mirroring Blue & Red from Logo) */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#155ea3]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#ec1415]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Header (Clinic Logo & Text) */}
      <div className="relative z-10 flex items-center justify-center gap-3.5 mb-6 sm:mb-8 text-white">
        <img 
          src="/logo-badge.png" 
          alt="Logo Klinik ELMedika" 
          className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 drop-shadow-xl rounded-full object-contain ring-2 ring-white/40 bg-white" 
        />
        <div className="flex flex-col">
          <div className="font-extrabold text-2xl sm:text-3xl tracking-tight leading-none text-white drop-shadow-xs">
            <span>Klinik </span>
            <span className="text-white">EL</span>
            <span className="text-[#ff4d4f]">Medika</span>
          </div>
          <span className="font-semibold text-xs sm:text-sm tracking-wider uppercase text-sky-200/90 mt-1.5">
            Praktek Dokter & Rumah Sunat Modern
          </span>
          <span className="text-[11px] font-medium tracking-widest uppercase text-white/60 mt-0.5">
            SIM Farmasi
          </span>
        </div>
      </div>

      {/* Main Glass/Navy Login Panel */}
      <div className="relative z-10 w-full max-w-[580px] bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-xl rounded-[32px] sm:rounded-[40px] border border-white/25 shadow-[0_25px_60px_rgba(2,12,30,0.6)] p-6 sm:p-10 overflow-hidden">
        
        {/* Subtle Brand Logo Watermark Inside Card */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07]">
          <img src="/logo.png" alt="watermark" className="w-80 h-80 object-contain filter invert brightness-200" />
        </div>

        {/* Card Title */}
        <h2 className="relative z-10 text-center text-white text-lg sm:text-xl font-light tracking-[0.25em] uppercase mb-6 drop-shadow-xs">
          USER LOGIN
        </h2>

        {/* Role Selector Pills */}
        <div className="relative z-10 flex items-center justify-center gap-2.5 sm:gap-3 mb-5">
          {roles.map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleSelect(r)}
                className={`px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-md ${
                  isSelected
                    ? 'bg-[#ec1415] text-white shadow-lg shadow-rose-950/40 ring-2 ring-white/90 scale-105'
                    : 'bg-[#0f3d6b]/80 text-white/90 hover:bg-[#155ea3] hover:text-white border border-white/10'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Active Staff Info Pill */}
        <div className="relative z-10 flex justify-center mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/25 backdrop-blur-xs text-white/95 text-[11px] sm:text-xs font-medium border border-white/15">
            <span className="w-2 h-2 rounded-full bg-[#ec1415] animate-pulse" />
            <span>Akses Peran: <strong>{activeRole.name}</strong> ({activeRole.roleTitle})</span>
          </div>
        </div>

        {/* Error Notification */}
        {(localError || error) && (
          <div className="relative z-10 mb-4 px-4 py-2.5 bg-white text-rose-700 text-xs font-semibold rounded-full shadow-md flex items-center justify-center gap-2 max-w-[460px] mx-auto border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#ec1415]" />
            <span className="truncate">{localError || error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="relative z-10 max-w-[460px] mx-auto space-y-3.5 sm:space-y-4">
          
          {/* Email Pill Input */}
          <div className="relative">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#155ea3] text-white flex items-center justify-center shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@almedika.com"
              className="w-full h-12 sm:h-13 pl-13 pr-4 rounded-full bg-white text-slate-800 font-medium text-xs sm:text-sm border border-slate-200 shadow-inner focus:outline-hidden focus:ring-2 focus:ring-[#155ea3] transition"
            />
          </div>

          {/* Password Pill Input */}
          <div className="relative">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#155ea3] text-white flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-12 sm:h-13 pl-13 pr-11 rounded-full bg-white text-slate-800 font-medium text-xs sm:text-sm border border-slate-200 shadow-inner focus:outline-hidden focus:ring-2 focus:ring-[#155ea3] transition font-mono tracking-wider"
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
                className="w-3.5 h-3.5 rounded border-white/60 bg-white/20 text-[#155ea3] focus:ring-0 cursor-pointer accent-[#155ea3]"
              />
              <span>Remember Me</span>
            </label>
            <button
              type="button"
              onClick={() => setForgotModalOpen(true)}
              className="text-white/90 hover:text-white hover:underline cursor-pointer"
            >
              Lupa Sandi?
            </button>
          </div>

          {/* Login Submit Button */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={loading}
              className="min-w-[170px] px-8 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-[#155ea3] to-[#0f3d6b] hover:from-[#ec1415] hover:to-[#c91011] text-white font-bold text-sm sm:text-base tracking-wider shadow-lg shadow-black/40 hover:shadow-rose-950/50 transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 border border-white/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Masuk Sistem</span>
              )}
            </button>
          </div>

        </form>

      </div>

      {/* Reset Password Assistance Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-slate-800 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#155ea3] font-bold text-sm">
                <HelpCircle className="w-5 h-5 text-[#155ea3]" />
                <span>Bantuan Akses Sandi</span>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Untuk alasan keamanan rekam medis dan data obat klinik, pengaturan ulang kata sandi dilakukan secara internal oleh <strong>IT Administrator Klinik ELMedika</strong>.
            </p>
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-medium space-y-1">
              <div>Akun Demo Default:</div>
              <div className="font-mono text-[11px] font-semibold text-blue-950">Password: password123</div>
            </div>
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="px-4 py-1.5 bg-[#155ea3] hover:bg-[#0f3d6b] text-white font-semibold rounded-lg text-xs"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info with Logo Slogan */}
      <div className="relative z-10 mt-6 text-center text-xs text-white/70 font-medium space-y-1">
        <p className="tracking-widest uppercase text-sky-200/80 text-[11px]">
          —— Nyaman, Modern, Profesional ——
        </p>
        <p>© {new Date().getFullYear()} Klinik ELMedika · Rumah Sunat ELNARA · Bandar Lampung</p>
      </div>

    </div>
  );
}
