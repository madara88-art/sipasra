import React from 'react';
import {
  LayoutDashboard,
  Users,
  Home,
  UserCheck,
  CalendarClock,
  Sparkles,
  BookOpen,
  HeartPulse,
  MessageSquareHeart,
  TrendingUp,
  Scale,
  FileSpreadsheet,
  X,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MenuItemId } from '../../types';

interface MenuItemConfig {
  id: MenuItemId;
  label: string;
  icon: React.ElementType;
  badge?: (counts: { sakit: number; konseling: number; pelanggaran: number }) => number | null;
}

const MENU_GROUPS: { groupLabel: string; items: MenuItemConfig[] }[] = [
  {
    groupLabel: 'General',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'siswa', label: 'Data Siswa', icon: Users },
      { id: 'kamar', label: 'Data Kamar', icon: Home },
      { id: 'wali-asuh', label: 'Data Wali Asuh', icon: UserCheck },
    ],
  },
  {
    groupLabel: 'Activities',
    items: [
      { id: 'kegiatan-harian', label: 'Kegiatan Harian', icon: CalendarClock },
      { id: 'kebersihan', label: 'Kebersihan & Kerapian', icon: Sparkles },
      { id: 'ibadah', label: 'Ibadah', icon: BookOpen },
      {
        id: 'kesehatan',
        label: 'Kesehatan',
        icon: HeartPulse,
        badge: (c) => (c.sakit > 0 ? c.sakit : null),
      },
      {
        id: 'konseling',
        label: 'Konseling',
        icon: MessageSquareHeart,
        badge: (c) => (c.konseling > 0 ? c.konseling : null),
      },
    ],
  },
  {
    groupLabel: 'Evaluation',
    items: [
      { id: 'perkembangan-anak', label: 'Perkembangan Anak', icon: TrendingUp },
      {
        id: 'pelanggaran',
        label: 'Pelanggaran & Pembinaan',
        icon: Scale,
        badge: (c) => (c.pelanggaran > 0 ? c.pelanggaran : null),
      },
      { id: 'laporan', label: 'Laporan & Raport', icon: FileSpreadsheet },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const {
    activeMenu,
    setActiveMenu,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    kesehatanList,
    konselingList,
    pelanggaranList,
    resetToDefaultData,
  } = useApp();

  const sakitCount = kesehatanList.filter(
    (k) => k.status === 'Dalam Perawatan' || k.status === 'Observasi'
  ).length;
  const konselingCount = konselingList.filter(
    (k) => k.status === 'Perlu Pemantauan' || k.status === 'Bimbingan Lanjutan'
  ).length;
  const pelanggaranCount = pelanggaranList.filter(
    (p) => p.status === 'Sedang Berjalan'
  ).length;

  const handleSelect = (id: MenuItemId) => {
    setActiveMenu(id);
    setMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#1a1c1a]/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Sidebar Container with Variation 2 styling */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-[#fdfcf9] border-r-[1.5px] border-[#1a1c1a] flex flex-col transition-transform duration-200 ease-out md:translate-x-0 md:static md:z-10 no-print ${
          mobileDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b-[1.5px] border-[#1a1c1a] flex items-start justify-between">
          <div className="brand">
            <h1 className="font-syne text-[1.85rem] font-extrabold tracking-[-0.04em] text-[#006b54] leading-[0.9] mb-1">
              SI-PASRA
            </h1>
            <p className="font-mono-custom text-[0.62rem] uppercase tracking-[0.1em] text-[#1a1c1a]/60 font-bold">
              Sekolah Rakyat 1 Jepara
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1 text-[#1a1c1a] hover:bg-[#1a1c1a]/10 rounded border border-[#1a1c1a] md:hidden"
            aria-label="Tutup menu navigasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation grouped by category */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
          {MENU_GROUPS.map((group) => (
            <div key={group.groupLabel}>
              <div className="font-mono-custom text-[0.65rem] uppercase tracking-wider text-[#1a1c1a]/50 font-bold px-2.5 mb-1.5">
                // {group.groupLabel}
              </div>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.id;
                  const badgeCount = item.badge
                    ? item.badge({
                        sakit: sakitCount,
                        konseling: konselingCount,
                        pelanggaran: pelanggaranCount,
                      })
                    : null;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition-all text-left ${
                        isActive
                          ? 'bg-[#1a1c1a] text-[#fdfcf9] font-bold shadow-xs'
                          : 'text-[#1a1c1a] hover:bg-[#1a1c1a]/8 active:bg-[#1a1c1a]/15'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#fdfcf9]' : 'text-[#1a1c1a]/70'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {badgeCount !== null && (
                        <span
                          className={`font-mono-custom text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                            isActive
                              ? 'bg-[#fdfcf9] text-[#1a1c1a] border-[#fdfcf9]'
                              : 'bg-rose-500 text-white border-rose-600'
                          }`}
                        >
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer info & Reset Data */}
        <div className="p-4 border-t-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] flex items-center justify-between text-xs">
          <div>
            <div className="font-mono-custom text-[0.68rem] text-[#1a1c1a]/60 font-bold uppercase">
              TA 2026/2027
            </div>
            <div className="text-[10px] text-[#1a1c1a]/40 font-mono-custom">
              Jepara, Jawa Tengah
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset data contoh ke bawaan awal?')) {
                resetToDefaultData();
              }
            }}
            className="p-1.5 text-[#1a1c1a]/60 hover:text-[#1a1c1a] hover:bg-[#1a1c1a]/10 rounded border border-[#1a1c1a]/30 transition-colors"
            title="Reset data awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    </>
  );
};
