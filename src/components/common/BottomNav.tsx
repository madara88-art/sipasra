import React from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  HeartPulse,
  Grid,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MenuItemId } from '../../types';

export const BottomNav: React.FC = () => {
  const { activeMenu, setActiveMenu, setMobileDrawerOpen, kesehatanList } = useApp();

  const sakitCount = kesehatanList.filter(
    (k) => k.status === 'Dalam Perawatan' || k.status === 'Observasi'
  ).length;

  const navItems = [
    { id: 'dashboard' as MenuItemId, label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'siswa' as MenuItemId, label: 'SISWA', icon: Users },
    { id: 'ibadah' as MenuItemId, label: 'IBADAH', icon: BookOpen },
    {
      id: 'kesehatan' as MenuItemId,
      label: 'RAWAT',
      icon: HeartPulse,
      badge: sakitCount > 0 ? sakitCount : null,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#fdfcf9] border-t-[1.5px] border-[#1a1c1a] md:hidden no-print">
      <div className="grid grid-cols-5 items-center h-15 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveMenu(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`relative flex flex-col items-center justify-center py-1 h-full transition-colors ${
                isActive ? 'bg-[#1a1c1a] text-[#fdfcf9]' : 'text-[#1a1c1a]/70 hover:bg-[#1a1c1a]/5'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 px-1 text-[8px] font-bold font-mono-custom text-white bg-rose-600 rounded">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-mono-custom font-bold tracking-wider mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* 5th button: All Menus / Lainnya */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center py-1 h-full text-[#1a1c1a]/70 hover:bg-[#1a1c1a]/5 transition-colors border-l border-[#1a1c1a]/15"
        >
          <Grid className="w-4 h-4 text-[#1a1c1a]" />
          <span className="text-[9px] font-mono-custom font-bold tracking-wider mt-0.5">
            MENU (12)
          </span>
        </button>
      </div>
    </nav>
  );
};
