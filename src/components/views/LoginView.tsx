import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginView: React.FC = () => {
  const { login, siswaList, kamarList, waliAsuhList } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const result = login(username, password, rememberSession);
    if (!result.success) {
      setErrorMessage(result.error || 'Username atau password tidak sesuai.');
    }
  };

  const handleFillAdmin = () => {
    setUsername('admin');
    setPassword('1234');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#fdfcf9] text-[#1a1c1a] flex flex-col justify-between selection:bg-[#006b54] selection:text-white">
      {/* Top Bar */}
      <header className="border-b-[1.5px] border-[#1a1c1a] bg-[#fdfcf9]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <svg
              viewBox="0 0 36 36"
              className="w-8 h-8 shrink-0"
              aria-hidden="true"
            >
              <rect
                x="1.5"
                y="1.5"
                width="33"
                height="33"
                rx="6"
                fill="#006b54"
                stroke="#1a1c1a"
                strokeWidth="2"
              />
              <path
                d="M8 17.5L18 9.5L28 17.5"
                fill="none"
                stroke="#fdfcf9"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11 24.5C13.5 23 15.8 23 18 24.5C20.2 23 22.5 23 25 24.5V18C22.5 16.7 20.2 16.7 18 18C15.8 16.7 13.5 16.7 11 18V24.5Z"
                fill="#fdfcf9"
              />
            </svg>
            <span className="font-syne text-xl font-extrabold tracking-tight text-[#006b54]">
              SI-PASRA
            </span>
          </div>

          <div className="text-xs font-mono-custom text-[#1a1c1a]/70 hidden sm:flex items-center gap-2 whitespace-nowrap">
            <span>Sekolah Rakyat Terintegrasi 1 Jepara</span>
            <span aria-hidden="true">·</span>
            <span>Tahun Ajaran 2026/2027</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Editorial Showcase */}
          <section className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 bg-[#f5f3ed] border-[1.5px] border-[#1a1c1a]">
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-xs font-mono-custom text-[#006b54] font-bold">
                <span>Sistem Informasi Pengasuhan Asrama</span>
                <span aria-hidden="true">·</span>
                <span>Jepara</span>
              </div>

              <h1 className="font-syne text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a1c1a] leading-[1.12] text-balance max-w-xl">
                Pendampingan karakter, ibadah, dan keseharian santri dalam satu ruang kerja.
              </h1>

              <p className="text-sm sm:text-base text-[#1a1c1a]/75 leading-relaxed max-w-xl">
                Portal terpadu bagi Administrator, Wali Asrama, dan Wali Asuh untuk mencatat presensi kegiatan harian, kebersihan kamar, sholat berjamaah, kesehatan, konseling, hingga raport pengasuhan.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#1a1c1a]/20 grid grid-cols-3 gap-4">
              <div>
                <div className="font-mono-custom tabular-nums text-2xl sm:text-3xl font-bold text-[#006b54]">
                  {siswaList.length}
                </div>
                <div className="text-xs text-[#1a1c1a]/70 mt-1">Santri Terbina</div>
              </div>
              <div>
                <div className="font-mono-custom tabular-nums text-2xl sm:text-3xl font-bold text-[#1a1c1a]">
                  {kamarList.length}
                </div>
                <div className="text-xs text-[#1a1c1a]/70 mt-1">Kamar Asrama</div>
              </div>
              <div>
                <div className="font-mono-custom tabular-nums text-2xl sm:text-3xl font-bold text-[#1a1c1a]">
                  {waliAsuhList.length}
                </div>
                <div className="text-xs text-[#1a1c1a]/70 mt-1">Wali Asuh Aktif</div>
              </div>
            </div>
          </section>

          {/* Right Login Form */}
          <section className="lg:col-span-5 bg-white border-[1.5px] border-[#1a1c1a] shadow-[6px_6px_0px_#1a1c1a] p-6 sm:p-8 flex flex-col justify-center">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-xs font-mono-custom text-[#006b54] font-bold mb-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Otentikasi Petugas</span>
              </div>
              <h2 className="font-syne text-2xl font-extrabold text-[#1a1c1a] tracking-tight">
                Masuk ke SI-PASRA
              </h2>
              <p className="text-xs text-[#1a1c1a]/65 mt-1">
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
                  <User className="w-4 h-4 text-[#1a1c1a]/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="admin"
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
                  <Lock className="w-4 h-4 text-[#1a1c1a]/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="••••"
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

              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2 text-xs text-[#1a1c1a]/80 cursor-pointer select-none">
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

            <div className="mt-6 pt-4 border-t border-[#1a1c1a]/15 flex items-center justify-between gap-3 text-xs">
              <div className="text-[#1a1c1a]/70 font-mono-custom">
                <span>User: </span>
                <strong className="text-[#1a1c1a]">admin</strong>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>Pass: </span>
                <strong className="text-[#1a1c1a]">1234</strong>
              </div>

              <button
                type="button"
                onClick={handleFillAdmin}
                className="px-3 py-1.5 text-xs font-semibold text-[#006b54] hover:bg-[#006b54]/10 border border-[#006b54] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Isi Admin
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-[1.5px] border-[#1a1c1a] py-3.5 px-4 sm:px-6 bg-[#fdfcf9] font-mono-custom text-[11px] text-[#1a1c1a]/65 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 SI-PASRA · Sekolah Rakyat Terintegrasi 1 Jepara</span>
        <span>Jepara, Jawa Tengah</span>
      </footer>
    </div>
  );
};
