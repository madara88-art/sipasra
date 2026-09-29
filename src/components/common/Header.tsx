import React from 'react';
import { Menu, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MenuItemId } from '../../types';

const MENU_LABELS: Record<MenuItemId, string> = {
  dashboard: 'Dashboard',
  siswa: 'Data Siswa',
  kamar: 'Data Kamar',
  'wali-asuh': 'Data Wali Asuh',
  'kegiatan-harian': 'Kegiatan Harian',
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
    waliAsuhList,
  } = useApp();

  const currentWali = waliAsuhList[0] || {
    nama: 'Ust. Jendral',
    shiftPiket: 'Pagi (05:00 - 13:00)',
  };
  const currentInitials = currentWali.nama.replace('Ust. ', '').slice(0, 2).toUpperCase() || 'JN';

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
              //
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#1a1c1a] tracking-tight uppercase font-mono-custom truncate">
              {MENU_LABELS[activeMenu]}
            </span>
          </div>
        </div>

        {/* Center/Right: Search & User Pill */}
        <div className="flex items-center gap-3">
          {/* Minimal Editorial Search bar */}
          <div className="relative hidden sm:flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or room..."
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

          {/* User Pill from Variation 2 */}
          <div className="flex items-center gap-2.5 px-3 py-1 border-[1.5px] border-[#1a1c1a] rounded-full bg-[#fdfcf9] shrink-0">
            <div className="text-right hidden sm:block">
              <div className="font-bold text-xs text-[#1a1c1a] leading-tight">{currentWali.nama}</div>
              <div className="text-[9px] text-[#006b54] font-mono-custom font-bold uppercase tracking-wider">
                WALI ASUH PIKET
              </div>
            </div>
            <div className="w-7 h-7 bg-[#1a1c1a] text-[#fdfcf9] rounded-full flex items-center justify-center text-[10px] font-bold font-mono-custom">
              {currentInitials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
