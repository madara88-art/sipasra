import React from 'react';
import { LogOut, Menu, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MenuItemId } from '../../types';

const MENU_LABELS: Record<MenuItemId, string> = {
  dashboard: 'Dashboard',
  siswa: 'Data Siswa',
  kamar: 'Data Kamar',
  'wali-asuh': 'Data Wali Asuh',
  'kegiatan-harian': 'Kegiatan Harian',
  'pergantian-shift': 'Catatan Pergantian Shift',
  kebersihan: 'Kebersihan & Kerapian',
  ibadah: 'Ibadah',
  kesehatan: 'Kesehatan',
  konseling: 'Konseling',
  'perkembangan-anak': 'Perkembangan Anak',
  pelanggaran: 'Pelanggaran & Pembinaan',
  laporan: 'Laporan',
};

export const Header: React.FC = () => {
  const {
    activeMenu,
    searchQuery,
    setSearchQuery,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    currentUser,
    logout,
  } = useApp();

  const displayName = currentUser?.displayName || 'Administrator';
  const displayRole = currentUser?.role || 'Admin';
  const currentInitials = displayName
    .replace(/^(Ust\.|Pak|Bu)\s+/i, '')
    .slice(0, 2)
    .toUpperCase() || 'AD';

  return (
    <header className="sticky top-0 z-30 bg-[#fdfcf9] border-b-[1.5px] border-[#1a1c1a] no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="p-2 -ml-2 text-[#1a1c1a] hover:bg-[#1a1c1a]/10 rounded border border-[#1a1c1a] md:hidden active:bg-[#1a1c1a]/20 transition-colors"
            aria-label="Buka menu navigasi"
          >
            {mobileDrawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2 truncate">
            <span className="font-syne text-lg sm:text-xl font-bold tracking-tight text-[#006b54] md:hidden">
              SI-PASRA
            </span>
            <span className="text-xs text-[#1a1c1a]/40 font-mono-custom hidden md:inline">
              /
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#1a1c1a] tracking-tight uppercase font-mono-custom truncate">
              {MENU_LABELS[activeMenu]}
            </span>
          </div>
        </div>

        {/* Center/Right: Search & User Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Minimal Editorial Search bar */}
          <div className="relative hidden sm:flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari siswa atau kamar..."
              className="w-44 md:w-60 text-xs py-1.5 pl-7 pr-3 bg-transparent border-b-[1.5px] border-[#1a1c1a] text-[#1a1c1a] placeholder:text-[#1a1c1a]/40 focus:outline-none focus:border-[#006b54] font-mono-custom transition-all"
            />
            <Search className="w-3.5 h-3.5 text-[#1a1c1a]/60 absolute left-1 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 text-[#1a1c1a]/50 hover:text-[#1a1c1a] text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Active Account Info */}
          <div className="flex items-center gap-2.5 px-2.5 py-1 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] shrink-0">
            <div className="text-right hidden sm:block">
              <div className="font-bold text-xs text-[#1a1c1a] leading-tight">{displayName}</div>
              <div className="text-[10px] text-[#006b54] font-mono-custom font-bold uppercase tracking-wider">
                {displayRole}
              </div>
            </div>
            <div className="w-7 h-7 bg-[#1a1c1a] text-[#fdfcf9] flex items-center justify-center text-[10px] font-bold font-mono-custom">
              {currentInitials}
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            title="Keluar dari akun"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-bold font-mono-custom border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-[#1a1c1a] hover:bg-rose-50 hover:text-rose-800 hover:border-rose-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
