import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, LogIn, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginView: React.FC = () => {
  const { login } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const result = login(username, password, rememberSession);
    if (!result.success) {
      setErrorMessage(result.error || 'Username atau password tidak sesuai.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#1a1c1a] flex flex-col justify-between selection:bg-[#006b54] selection:text-white">
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-3xl bg-white border-[1.5px] border-[#1a1c1a] shadow-[6px_6px_0px_#1a1c1a] grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Logo Sekolah Rakyat */}
          <div className="md:col-span-5 bg-white p-6 sm:p-8 flex flex-col items-center justify-center text-center border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-[#1a1c1a]">
            {!logoFailed ? (
              <img
                src="/assets/aistudio/PASRAH_AJA_585f5260.png"
                alt="Logo SI-PASRA Sekolah Rakyat"
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
                className="w-44 h-44 sm:w-52 sm:h-52 object-contain select-none"
              />
            ) : (
              <div className="w-40 h-40 flex flex-col items-center justify-center border border-[#1a1c1a]/20 bg-[#fdfcf9] p-4">
                <span className="font-syne text-2xl font-extrabold text-[#006b54]">
                  SI-PASRA
                </span>
                <span className="text-xs text-[#1a1c1a]/70 mt-1">
                  Sekolah Rakyat
                </span>
              </div>
            )}

            <div className="mt-4 space-y-0.5">
              <p className="font-syne text-sm font-bold text-[#1a1c1a]">
                Sekolah Rakyat Terintegrasi 1 Jepara
              </p>
              <p className="text-xs text-[#1a1c1a]/60">
                Sistem Pengasuhan Asrama
              </p>
            </div>
          </div>

          {/* Form Masuk */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-white">
            <div className="mb-6">
              <h1 className="font-syne text-2xl font-extrabold text-[#1a1c1a] tracking-tight">
                Masuk
              </h1>
              <p className="text-xs sm:text-sm text-[#1a1c1a]/65 mt-1">
                Masukkan username dan password akun pengasuhan Anda.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3 bg-rose-50 border border-rose-400 text-rose-900 text-xs font-medium flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-bold text-[#1a1c1a] mb-1.5"
                >
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#1a1c1a]/45 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Masukkan username"
                    autoComplete="username"
                    autoFocus
                    className="w-full min-h-[44px] pl-10 pr-3 py-2.5 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] text-sm text-[#1a1c1a] placeholder:text-[#1a1c1a]/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006b54] focus:border-[#006b54] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-[#1a1c1a] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#1a1c1a]/45 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    className="w-full min-h-[44px] pl-10 pr-11 py-2.5 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] text-sm text-[#1a1c1a] placeholder:text-[#1a1c1a]/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006b54] focus:border-[#006b54] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#1a1c1a]/60 hover:text-[#1a1c1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006b54]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="inline-flex items-center gap-2 text-xs text-[#1a1c1a]/75 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="w-4 h-4 accent-[#006b54] border-[#1a1c1a] rounded-none"
                  />
                  <span>Tetap masuk di perangkat ini</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#006b54] hover:bg-[#005240] text-white text-sm font-bold border-[1.5px] border-[#1a1c1a] shadow-[3px_3px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk</span>
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="py-4 px-4 sm:px-6 text-center text-xs text-[#1a1c1a]/60">
        © 2026 SI-PASRA · Sekolah Rakyat Terintegrasi 1 Jepara
      </footer>
    </div>
  );
};
